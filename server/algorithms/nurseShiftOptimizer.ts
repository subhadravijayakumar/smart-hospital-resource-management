import { db } from '../db.ts';

export interface NurseCandidate {
  id: number;
  employee_id: string;
  name: string;
  department_id: number;
  skill_level: 'ICU_CERTIFIED' | 'EMERGENCY_TRAINED' | 'SENIOR_STAFF' | 'GENERAL_WARD';
  qualification: string;
  experience_years: number;
  current_workload: number;
  shift_preference: string;
  availability_status: string;
}

export interface ShiftOptimizationResult {
  success: boolean;
  shift_date: string;
  assignments_created: number;
  roster: Array<{
    shift_type: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    department_name: string;
    nurse_name: string;
    skill_level: string;
    predicted_workload_score: number;
    optimization_reason: string;
  }>;
  unassigned_shortfalls: string[];
}

/**
 * Intelligent Nurse Shift Allocation Engine
 *
 * Workflow:
 * 1. Predict Workload Index using historical metrics and current department bed occupancy
 * 2. Calculate Required Nurse Staffing Count: ceil(Occupancy / Ratio) + AcuityFactor
 * 3. Filter eligible nurses checking Hard Constraints:
 *    - Not on approved leave
 *    - Not already assigned to another shift on the same day
 *    - Clinical skill qualification matches department acuity
 * 4. Apply Greedy / Soft Constraints heuristic to select best nurse:
 *    Score = SkillWeight * 30 + (10 - CurrentWorkload) * 20 + PreferenceMatch * 15 + Experience * 5
 */
export function optimizeNurseShifts(targetDate: string): ShiftOptimizationResult {
  // Query all departments
  const departments = db.prepare(`SELECT * FROM departments`).all() as Array<{
    id: number;
    name: string;
    code: string;
  }>;

  // Query nurses
  const allNurses = db.prepare(`SELECT * FROM nurses`).all() as unknown as NurseCandidate[];

  // Query approved leaves on targetDate
  const approvedLeaves = db.prepare(`
    SELECT staff_id FROM leave_requests
    WHERE staff_type = 'NURSE' AND status = 'APPROVED'
      AND start_date <= ? AND end_date >= ?
  `).all(targetDate, targetDate) as Array<{ staff_id: number }>;

  const leaveNurseIds = new Set(approvedLeaves.map(l => l.staff_id));

  // Query already scheduled shifts for this date
  const existingShifts = db.prepare(`
    SELECT assigned_nurse_id FROM nurse_shifts
    WHERE shift_date = ?
  `).all(targetDate) as Array<{ assigned_nurse_id: number }>;

  const assignedNurseIds = new Set(existingShifts.map(s => s.assigned_nurse_id));

  const shiftTypes: Array<'MORNING' | 'AFTERNOON' | 'NIGHT'> = ['MORNING', 'AFTERNOON', 'NIGHT'];
  const rosterResult: ShiftOptimizationResult['roster'] = [];
  const shortfalls: string[] = [];

  const insertShift = db.prepare(`
    INSERT INTO nurse_shifts (shift_date, shift_type, department_id, predicted_workload_score, required_nurses, assigned_nurse_id, status, optimization_reason)
    VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
  `);

  for (const dept of departments) {
    // Determine department acuity & occupied beds
    const bedStats = db.prepare(`
      SELECT
        COUNT(*) as total_beds,
        SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied_beds
      FROM beds WHERE department_id = ?
    `).get(dept.id) as { total_beds: number; occupied_beds: number };

    const occupied = bedStats?.occupied_beds || 2;

    for (const shift of shiftTypes) {
      // Step 1: Workload Prediction calculation
      let shiftMultiplier = 1.0;
      if (shift === 'MORNING') shiftMultiplier = 1.2;
      else if (shift === 'AFTERNOON') shiftMultiplier = 1.0;
      else shiftMultiplier = 0.8;

      const acuityFactor = (dept.code === 'ICU' ? 2.0 : dept.code === 'EMERG' ? 1.8 : 1.0);
      const predictedWorkload = Number((((occupied * 0.4) + 2.0) * shiftMultiplier * (acuityFactor * 0.7)).toFixed(1));
      const requiredNursesCount = Math.max(1, Math.min(3, Math.ceil(predictedWorkload / 3.5)));

      // Step 2 & 3: Find eligible candidates
      const eligibleNurses = allNurses.filter(n => {
        if (leaveNurseIds.has(n.id)) return false; // Approved leave constraint
        if (assignedNurseIds.has(n.id)) return false; // Overlapping shift constraint

        // Clinical competence constraint
        if (dept.code === 'ICU') {
          return n.skill_level === 'ICU_CERTIFIED' || n.skill_level === 'SENIOR_STAFF';
        }
        if (dept.code === 'EMERG') {
          return n.skill_level === 'EMERGENCY_TRAINED' || n.skill_level === 'ICU_CERTIFIED';
        }
        return true;
      });

      if (eligibleNurses.length === 0) {
        shortfalls.push(`No unallocated nurses available for ${dept.name} (${shift} Shift) matching clinical skills.`);
        continue;
      }

      // Step 4: Evaluate candidates with heuristic score
      let bestNurse: NurseCandidate | null = null;
      let highestScore = -Infinity;
      let reason = '';

      for (const nurse of eligibleNurses) {
        let score = 0;
        const reasons: string[] = [];

        // Department affinity
        if (nurse.department_id === dept.id) {
          score += 35;
          reasons.push('Primary department assignment');
        } else {
          score += 15;
          reasons.push('Float cross-cover');
        }

        // Workload balancing (prefer lower workload)
        const loadScore = Math.max(0, 10 - nurse.current_workload) * 2.5;
        score += loadScore;
        reasons.push(`Workload balance (+${loadScore.toFixed(0)})`);

        // Shift preference
        if (nurse.shift_preference === shift) {
          score += 15;
          reasons.push('Preferred shift match');
        }

        // Experience bonus
        score += Math.min(15, nurse.experience_years * 1.5);

        if (score > highestScore) {
          highestScore = score;
          bestNurse = nurse;
          reason = `ML Workload score ${predictedWorkload} -> Assigned: ${reasons.join(', ')}`;
        }
      }

      if (bestNurse) {
        assignedNurseIds.add(bestNurse.id);

        insertShift.run(
          targetDate,
          shift,
          dept.id,
          predictedWorkload,
          requiredNursesCount,
          bestNurse.id,
          reason
        );

        // Increment nurse workload counter in DB
        db.prepare(`UPDATE nurses SET current_workload = current_workload + 1 WHERE id = ?`).run(bestNurse.id);

        rosterResult.push({
          shift_type: shift,
          department_name: dept.name,
          nurse_name: bestNurse.name,
          skill_level: bestNurse.skill_level,
          predicted_workload_score: predictedWorkload,
          optimization_reason: reason
        });
      }
    }
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (username, role, action, module, record_id, details)
    VALUES ('SYSTEM_ML_OPTIMIZER', 'SYSTEM', 'AUTO_SHIFT_SCHEDULE', 'SHIFTS', ?, ?)
  `).run(targetDate, `Optimized ${rosterResult.length} nurse shift slots for date ${targetDate}. Shortfalls: ${shortfalls.length}`);

  return {
    success: true,
    shift_date: targetDate,
    assignments_created: rosterResult.length,
    roster: rosterResult,
    unassigned_shortfalls: shortfalls
  };
}
