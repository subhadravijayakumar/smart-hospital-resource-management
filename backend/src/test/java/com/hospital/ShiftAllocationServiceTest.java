package com.hospital;

import com.hospital.service.ShiftAllocationService;
import com.hospital.service.ShiftAllocationService.NurseProfile;
import com.hospital.service.ShiftAllocationService.ShiftSlot;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ShiftAllocationServiceTest {

    @Test
    @DisplayName("Should never schedule nurse with approved leave")
    void testApprovedLeaveEnforcesExclusion() {
        ShiftAllocationService scheduler = new ShiftAllocationService();
        LocalDate targetDate = LocalDate.now();

        NurseProfile nurseOnLeave = new NurseProfile(
            1L, "NUR-01", "Nurse On Vacation", 2L, "ICU_CERTIFIED", 10, 0, "MORNING", true
        );
        NurseProfile nurseAvailable = new NurseProfile(
            2L, "NUR-02", "Nurse Working", 2L, "ICU_CERTIFIED", 8, 2, "MORNING", true
        );

        ShiftSlot icuSlot = new ShiftSlot(targetDate, "MORNING", 2L, "ICU", 15);

        // Leave set contains nurse 1L
        Set<Long> approvedLeaves = Set.of(1L);

        var assignments = scheduler.optimizeShifts(List.of(icuSlot), List.of(nurseOnLeave, nurseAvailable), approvedLeaves);

        assertEquals(1, assignments.size());
        assertEquals(2L, assignments.get(0).assignedNurse().id());
        assertEquals("Nurse Working", assignments.get(0).assignedNurse().name());
    }
}
