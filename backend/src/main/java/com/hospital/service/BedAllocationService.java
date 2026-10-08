package com.hospital.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Greedy Bed Allocation Algorithm Service
 *
 * Algorithm Formulation:
 * 1. Filter: Candidate beds must have status == AVAILABLE, and satisfy life-support requirements
 *    (e.g., ventilator requirement, oxygen capability).
 * 2. Multi-Criteria Scoring:
 *    Score(B, P) = W_acuity * AcuityMatch(B.type, P.severity)
 *                + W_dept * DeptMatch(B.departmentId, P.departmentId)
 *                + W_equip * EquipCapability(B, P)
 *                + W_floor * FloorProximity(B.floor)
 * 3. Greedy Selection:
 *    SelectedBed = arg max { Score(B, P) for B in EligibleBeds }
 * 4. State Transition:
 *    SelectedBed.status = OCCUPIED
 *    Patient.admissionStatus = ADMITTED
 *    Patient.currentBed = SelectedBed
 *    Audit log and notifications dispatched.
 */
public class BedAllocationService {

    public record BedCandidate(
        Long id,
        String bedNumber,
        String ward,
        Long departmentId,
        String bedType,
        int floorNumber,
        String status,
        boolean hasVentilator,
        boolean hasOxygenSupport
    ) {}

    public record AllocationRequest(
        Long patientId,
        String patientName,
        String severity, // EMERGENCY, CRITICAL, HIGH, NORMAL
        Long assignedDepartmentId,
        boolean requiresVentilator,
        boolean requiresOxygen,
        String preferredBedType,
        String allocatedBy
    ) {}

    public record AllocationDecision(
        boolean success,
        String message,
        BedCandidate allocatedBed,
        double algorithmScore,
        String rationale,
        int candidatesEvaluated
    ) {}

    private static final double W_ACUITY = 40.0;
    private static final double W_DEPT = 25.0;
    private static final double W_EQUIP = 20.0;
    private static final double W_FLOOR = 15.0;

    /**
     * Executes the greedy choice algorithm over available candidate beds.
     */
    public AllocationDecision allocateBedGreedy(AllocationRequest request, List<BedCandidate> availableBeds) {
        if (availableBeds == null || availableBeds.isEmpty()) {
            return new AllocationDecision(false, "No beds currently available in hospital.", null, 0.0, "Empty candidate set", 0);
        }

        // 1. Filter eligible beds by hard clinical constraints
        List<BedCandidate> eligible = availableBeds.stream()
            .filter(b -> "AVAILABLE".equalsIgnoreCase(b.status()))
            .filter(b -> !request.requiresVentilator() || b.hasVentilator())
            .filter(b -> !request.requiresOxygen() || b.hasOxygenSupport())
            .toList();

        if (eligible.isEmpty()) {
            return new AllocationDecision(
                false,
                "No available beds satisfy required life-support constraints (Ventilator/Oxygen).",
                null, 0.0, "Hard constraint violation", availableBeds.size()
            );
        }

        // 2. Greedy optimization loop
        BedCandidate bestBed = null;
        double maxScore = -1.0;
        StringBuilder bestRationale = new StringBuilder();

        for (BedCandidate bed : eligible) {
            double score = 0.0;
            StringBuilder log = new StringBuilder();

            // A. Acuity & Bed Type matching
            double acuityFactor = switch (request.severity()) {
                case "EMERGENCY" -> "EMERGENCY".equals(bed.bedType()) ? 1.0 : ("ICU".equals(bed.bedType()) ? 0.95 : 0.4);
                case "CRITICAL" -> "ICU".equals(bed.bedType()) ? 1.0 : ("EMERGENCY".equals(bed.bedType()) ? 0.85 : 0.3);
                case "HIGH" -> ("SEMI_PRIVATE".equals(bed.bedType()) || "GENERAL".equals(bed.bedType())) ? 1.0 : 0.6;
                default -> ("GENERAL".equals(bed.bedType()) || "PRIVATE".equals(bed.bedType())) ? 1.0 : 0.15;
            };
            score += acuityFactor * W_ACUITY;
            log.append(String.format("Acuity: +%.1f; ", acuityFactor * W_ACUITY));

            // B. Department Affinity
            double deptFactor = (request.assignedDepartmentId() != null && request.assignedDepartmentId().equals(bed.departmentId())) ? 1.0 : 0.2;
            score += deptFactor * W_DEPT;
            log.append(String.format("Dept: +%.1f; ", deptFactor * W_DEPT));

            // C. Equipment optimization (prevent hoarding scarce ventilators for normal acuity)
            double equipFactor = 0.6;
            if (request.requiresVentilator() && bed.hasVentilator()) {
                equipFactor = 1.0;
            } else if (!request.requiresVentilator() && bed.hasVentilator()) {
                equipFactor = 0.3; // preservation penalty
            } else {
                equipFactor = 0.8;
            }
            score += equipFactor * W_EQUIP;

            // D. Floor proximity
            double floorFactor = Math.max(0.2, 1.0 - (bed.floorNumber() * 0.15));
            score += floorFactor * W_FLOOR;

            // Preferred bed bonus
            if (request.preferredBedType() != null && request.preferredBedType().equalsIgnoreCase(bed.bedType())) {
                score += 10.0;
            }

            if (score > maxScore) {
                maxScore = score;
                bestBed = bed;
                bestRationale = new StringBuilder(log.toString());
            }
        }

        if (bestBed != null) {
            return new AllocationDecision(
                true,
                "Greedy optimal bed allocated: " + bestBed.bedNumber(),
                bestBed,
                maxScore,
                bestRationale.toString(),
                eligible.size()
            );
        }

        return new AllocationDecision(false, "Unable to compute optimal allocation.", null, 0.0, "Computation fault", eligible.size());
    }
}
