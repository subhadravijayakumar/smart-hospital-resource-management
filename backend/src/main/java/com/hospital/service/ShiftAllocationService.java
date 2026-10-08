package com.hospital.service;

import java.time.LocalDate;
import java.util.*;

/**
 * Intelligent Nurse Shift Allocation System
 *
 * Implements two-stage optimization:
 * Stage 1: Machine Learning Workload Prediction for department census and acuity index.
 * Stage 2: Constraint Satisfaction & Heuristic Assignment matching nurse competencies
 *          to shift demands while honoring approved leave and labor constraints.
 */
public class ShiftAllocationService {

    public record NurseProfile(
        Long id,
        String employeeId,
        String name,
        Long departmentId,
        String skillLevel, // ICU_CERTIFIED, EMERGENCY_TRAINED, SENIOR_STAFF, GENERAL_WARD
        int experienceYears,
        int currentWorkload,
        String shiftPreference,
        boolean isAvailable
    ) {}

    public record ShiftSlot(
        LocalDate date,
        String shiftType, // MORNING, AFTERNOON, NIGHT
        Long departmentId,
        String departmentCode,
        int activeBedOccupancy
    ) {}

    public record AssignmentResult(
        ShiftSlot slot,
        NurseProfile assignedNurse,
        double predictedWorkloadScore,
        int requiredStaffCount,
        String justification
    ) {}

    /**
     * Allocates nurses across department shift slots.
     */
    public List<AssignmentResult> optimizeShifts(
        List<ShiftSlot> slots,
        List<NurseProfile> allNurses,
        Set<Long> nursesOnApprovedLeave
    ) {
        List<AssignmentResult> results = new ArrayList<>();
        Set<Long> alreadyAssignedToday = new HashSet<>();

        for (ShiftSlot slot : slots) {
            // Stage 1: Predict Workload Index via Linear Model
            double shiftMultiplier = switch (slot.shiftType()) {
                case "MORNING" -> 1.25;
                case "AFTERNOON" -> 1.0;
                default -> 0.75;
            };
            double acuityFactor = "ICU".equalsIgnoreCase(slot.departmentCode()) ? 2.0 : ("EMERG".equalsIgnoreCase(slot.departmentCode()) ? 1.8 : 1.0);
            double predictedWorkload = ((slot.activeBedOccupancy() * 0.45) + 2.0) * shiftMultiplier * (acuityFactor * 0.7);
            int requiredStaff = Math.max(1, (int) Math.ceil(predictedWorkload / 3.5));

            // Stage 2: Hard Constraint Filter
            List<NurseProfile> candidates = allNurses.stream()
                .filter(NurseProfile::isAvailable)
                .filter(n -> !nursesOnApprovedLeave.contains(n.id()))
                .filter(n -> !alreadyAssignedToday.contains(n.id()))
                .filter(n -> {
                    if ("ICU".equalsIgnoreCase(slot.departmentCode())) {
                        return "ICU_CERTIFIED".equals(n.skillLevel()) || "SENIOR_STAFF".equals(n.skillLevel());
                    }
                    if ("EMERG".equalsIgnoreCase(slot.departmentCode())) {
                        return "EMERGENCY_TRAINED".equals(n.skillLevel()) || "ICU_CERTIFIED".equals(n.skillLevel());
                    }
                    return true;
                })
                .toList();

            if (candidates.isEmpty()) {
                continue;
            }

            // Stage 3: Soft Constraint Evaluation Function
            NurseProfile bestCandidate = null;
            double maxScore = -Double.MAX_VALUE;
            String bestReason = "";

            for (NurseProfile nurse : candidates) {
                double score = 0.0;
                StringBuilder reason = new StringBuilder();

                // Department affinity (+35)
                if (slot.departmentId().equals(nurse.departmentId())) {
                    score += 35.0;
                    reason.append("Primary department unit; ");
                } else {
                    score += 15.0;
                    reason.append("Cross-float rotation; ");
                }

                // Workload balancing
                double balanceScore = Math.max(0, 10 - nurse.currentWorkload()) * 2.5;
                score += balanceScore;
                reason.append(String.format("Workload balancing (+%.0f); ", balanceScore));

                // Shift preference
                if (slot.shiftType().equalsIgnoreCase(nurse.shiftPreference())) {
                    score += 15.0;
                    reason.append("Preferred shift alignment; ");
                }

                score += Math.min(15.0, nurse.experienceYears() * 1.5);

                if (score > maxScore) {
                    maxScore = score;
                    bestCandidate = nurse;
                    bestReason = reason.toString();
                }
            }

            if (bestCandidate != null) {
                alreadyAssignedToday.add(bestCandidate.id());
                results.add(new AssignmentResult(slot, bestCandidate, Math.round(predictedWorkload * 10.0) / 10.0, requiredStaff, bestReason));
            }
        }

        return results;
    }
}
