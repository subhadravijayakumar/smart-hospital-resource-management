import { db } from '../db.ts';

export interface BedCandidate {
  id: number;
  bed_number: string;
  ward: string;
  department_id: number;
  department_name: string;
  bed_type: 'ICU' | 'EMERGENCY' | 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE' | 'PEDIATRIC';
  floor_number: number;
  status: string;
  has_ventilator: number;
  has_oxygen_support: number;
}

export interface PatientAllocationRequest {
  patient_id: number;
  patient_name: string;
  severity: 'EMERGENCY' | 'CRITICAL' | 'HIGH' | 'NORMAL';
  assigned_department_id?: number;
  requires_ventilator?: boolean;
  requires_oxygen?: boolean;
  preferred_bed_type?: string;
  triage_notes?: string;
  allocated_by?: string;
}

export interface AllocationResult {
  success: boolean;
  message: string;
  allocated_bed?: BedCandidate;
  score?: number;
  decision_rationale?: string;
  alternative_candidates_evaluated?: number;
}

/**
 * Greedy Bed Allocation Algorithm
 *
 * Mathematical formulation:
 * Objective: Maximize suitability Score(B, P) for candidate bed B given patient P
 * Subject to constraints:
 *   1. B.status == 'AVAILABLE'
 *   2. If P.requires_ventilator == true => B.has_ventilator == 1
 *   3. If P.requires_oxygen == true => B.has_oxygen_support == 1
 *   4. Acuity Tier compatibility (CRITICAL / EMERGENCY patients must receive ICU or EMERGENCY beds if available)
 *
 * Heuristic Evaluation Function:
 *   Score(B, P) = W_acuity * S_acuity(B.type, P.severity)
 *               + W_dept * S_dept(B.dept_id, P.dept_id)
 *               + W_equip * S_equip(B, P)
 *               + W_floor * S_floor(B.floor)
 */
export function runGreedyBedAllocation(request: PatientAllocationRequest): AllocationResult {
  // Query all AVAILABLE beds
  const availableBeds = db.prepare(`
    SELECT b.id, b.bed_number, b.ward, b.department_id, b.bed_type, b.floor_number,
           b.status, b.has_ventilator, b.has_oxygen_support, d.name as department_name
    FROM beds b
    JOIN departments d ON b.department_id = d.id
    WHERE b.status = 'AVAILABLE'
  `).all() as unknown as (BedCandidate & { department_name: string })[];

  if (availableBeds.length === 0) {
    return {
      success: false,
      message: 'No beds currently available in the hospital. Patient queued in emergency holding.',
      alternative_candidates_evaluated: 0
    };
  }

  // Filter candidates by hard medical requirements
  const eligibleBeds = availableBeds.filter(b => {
    if (request.requires_ventilator && !b.has_ventilator) return false;
    if (request.requires_oxygen && !b.has_oxygen_support) return false;
    return true;
  });

  if (eligibleBeds.length === 0) {
    return {
      success: false,
      message: `No available beds meet the required life-support constraints (Ventilator: ${request.requires_ventilator ? 'Yes' : 'No'}, Oxygen: ${request.requires_oxygen ? 'Yes' : 'No'}).`,
      alternative_candidates_evaluated: availableBeds.length
    };
  }

  // Weights for greedy scoring
  const W_ACUITY = 40;
  const W_DEPT = 25;
  const W_EQUIP = 20;
  const W_FLOOR = 15;

  let bestBed: BedCandidate | null = null;
  let highestScore = -Infinity;
  let bestRationale = '';

  for (const bed of eligibleBeds) {
    let score = 0;
    const rationaleParts: string[] = [];

    // 1. Acuity & Bed Type Suitability
    let acuityScore = 0;
    if (request.severity === 'EMERGENCY') {
      if (bed.bed_type === 'EMERGENCY') acuityScore = 1.0;
      else if (bed.bed_type === 'ICU') acuityScore = 0.95;
      else acuityScore = 0.4;
    } else if (request.severity === 'CRITICAL') {
      if (bed.bed_type === 'ICU') acuityScore = 1.0;
      else if (bed.bed_type === 'EMERGENCY') acuityScore = 0.85;
      else acuityScore = 0.3;
    } else if (request.severity === 'HIGH') {
      if (bed.bed_type === 'SEMI_PRIVATE' || bed.bed_type === 'GENERAL') acuityScore = 1.0;
      else if (bed.bed_type === 'PRIVATE') acuityScore = 0.85;
      else acuityScore = 0.5; // Avoid placing normal/high in scarce ICU unless necessary
    } else { // NORMAL
      if (bed.bed_type === 'GENERAL' || bed.bed_type === 'SEMI_PRIVATE' || bed.bed_type === 'PRIVATE') acuityScore = 1.0;
      else acuityScore = 0.1; // Heavily penalize wasting ICU for non-critical
    }
    score += acuityScore * W_ACUITY;
    rationaleParts.push(`Acuity compatibility: +${(acuityScore * W_ACUITY).toFixed(1)}`);

    // 2. Department Affinity
    let deptScore = 0;
    if (request.assigned_department_id && bed.department_id === request.assigned_department_id) {
      deptScore = 1.0;
      rationaleParts.push(`Department match (${bed.department_name}): +${W_DEPT}`);
    } else {
      deptScore = 0.2;
      rationaleParts.push(`Cross-department ward: +${(0.2 * W_DEPT).toFixed(1)}`);
    }
    score += deptScore * W_DEPT;

    // 3. Equipment Capability matching (Avoid over-provisioning ventilators to stable patients)
    let equipScore = 0.5;
    if (request.requires_ventilator && bed.has_ventilator) {
      equipScore = 1.0;
      rationaleParts.push(`Ventilator matched: +${W_EQUIP}`);
    } else if (!request.requires_ventilator && bed.has_ventilator) {
      // Small conservation penalty for consuming scarce ventilator bed for patient not needing it
      equipScore = 0.3;
      rationaleParts.push(`Ventilator preservation penalty applied`);
    } else {
      equipScore = 0.8;
    }
    score += equipScore * W_EQUIP;

    // 4. Floor Proximity & Traffic Minimization
    const floorScore = Math.max(0.2, 1 - (bed.floor_number * 0.15));
    score += floorScore * W_FLOOR;
    rationaleParts.push(`Floor ${bed.floor_number} accessibility: +${(floorScore * W_FLOOR).toFixed(1)}`);

    // Preferred type bonus if requested
    if (request.preferred_bed_type && bed.bed_type === request.preferred_bed_type) {
      score += 10;
      rationaleParts.push(`Patient preferred type matched (+10)`);
    }

    if (score > highestScore) {
      highestScore = score;
      bestBed = bed;
      bestRationale = `Selected via Greedy Heuristic Score ${score.toFixed(1)}/100: [${rationaleParts.join('; ')}]`;
    }
  }

  if (!bestBed) {
    return {
      success: false,
      message: 'No optimal bed could be selected matching constraints.',
      alternative_candidates_evaluated: eligibleBeds.length
    };
  }

  // Atomically perform assignment in Database
  try {
    db.exec('BEGIN TRANSACTION;');

    // Update bed
    db.prepare(`
      UPDATE beds
      SET status = 'OCCUPIED', current_patient_id = ?, last_cleaned_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(request.patient_id, bestBed.id);

    // Update patient
    db.prepare(`
      UPDATE patients
      SET admission_status = 'ADMITTED', current_bed_id = ?
      WHERE id = ?
    `).run(bestBed.id, request.patient_id);

    // Insert bed allocation
    db.prepare(`
      INSERT INTO bed_allocations (bed_id, patient_id, algorithm_score, decision_rationale, allocated_by, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `).run(bestBed.id, request.patient_id, highestScore, bestRationale, request.allocated_by || 'GREEDY_ALLOCATION_SERVICE');

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (username, role, action, module, record_id, details)
      VALUES (?, ?, 'ALLOCATE_BED', 'BED_MANAGEMENT', ?, ?)
    `).run(request.allocated_by || 'SYSTEM', 'ADMIN', String(bestBed.id), `Allocated bed ${bestBed.bed_number} to patient #${request.patient_id} (${request.patient_name}) with score ${highestScore.toFixed(1)}`);

    // Notification
    db.prepare(`
      INSERT INTO notifications (target_role, title, message, notification_type)
      VALUES ('ADMIN', 'Bed Allocated', 'Bed ${bestBed.bed_number} (${bestBed.ward}) was allocated to ${request.patient_name}.', 'BED_UPDATE')
    `).run();

    db.exec('COMMIT;');

    return {
      success: true,
      message: `Successfully allocated bed ${bestBed.bed_number} in ${bestBed.ward} (Score: ${highestScore.toFixed(1)})`,
      allocated_bed: bestBed,
      score: highestScore,
      decision_rationale: bestRationale,
      alternative_candidates_evaluated: eligibleBeds.length
    };
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
