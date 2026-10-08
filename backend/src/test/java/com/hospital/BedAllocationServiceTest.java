package com.hospital;

import com.hospital.service.BedAllocationService;
import com.hospital.service.BedAllocationService.AllocationRequest;
import com.hospital.service.BedAllocationService.BedCandidate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BedAllocationServiceTest {

    private BedAllocationService bedService;
    private List<BedCandidate> testBeds;

    @BeforeEach
    void setUp() {
        bedService = new BedAllocationService();
        testBeds = new ArrayList<>();

        // Add diverse candidate beds
        testBeds.add(new BedCandidate(1L, "EM-101", "Trauma Bay A", 1L, "EMERGENCY", 1, "AVAILABLE", true, true));
        testBeds.add(new BedCandidate(2L, "ICU-201", "Critical Care", 2L, "ICU", 2, "AVAILABLE", true, true));
        testBeds.add(new BedCandidate(3L, "GW-301", "General Medicine", 4L, "GENERAL", 3, "AVAILABLE", false, true));
        testBeds.add(new BedCandidate(4L, "GW-302", "General Medicine", 4L, "GENERAL", 3, "OCCUPIED", false, true)); // Occupied
    }

    @Test
    @DisplayName("Should assign ICU bed with ventilator to critical patient")
    void testCriticalPatientReceivesIcuBed() {
        AllocationRequest req = new AllocationRequest(
            101L, "John Doe", "CRITICAL", 2L, true, true, "ICU", "DOCTOR_1"
        );

        var result = bedService.allocateBedGreedy(req, testBeds);

        assertTrue(result.success());
        assertNotNull(result.allocatedBed());
        assertEquals("ICU-201", result.allocatedBed().bedNumber());
        assertTrue(result.allocatedBed().hasVentilator());
        assertTrue(result.algorithmScore() > 80.0);
    }

    @Test
    @DisplayName("Should reject allocation when required life-support constraints are not met")
    void testConstraintViolationWhenNoVentilatorAvailable() {
        List<BedCandidate> noVentBeds = List.of(
            new BedCandidate(10L, "GW-10", "General Ward", 4L, "GENERAL", 2, "AVAILABLE", false, true)
        );

        AllocationRequest req = new AllocationRequest(
            102L, "Jane Doe", "CRITICAL", 4L, true, true, null, "DOC_2"
        );

        var result = bedService.allocateBedGreedy(req, noVentBeds);

        assertFalse(result.success());
        assertNull(result.allocatedBed());
        assertTrue(result.message().contains("life-support"));
    }

    @Test
    @DisplayName("Should never allocate already occupied bed")
    void testNeverAllocatesOccupiedBed() {
        List<BedCandidate> occupiedOnly = List.of(
            new BedCandidate(11L, "ICU-99", "ICU", 2L, "ICU", 2, "OCCUPIED", true, true)
        );

        AllocationRequest req = new AllocationRequest(
            103L, "Alex Smith", "EMERGENCY", 2L, false, true, "ICU", "DOC_3"
        );

        var result = bedService.allocateBedGreedy(req, occupiedOnly);
        assertFalse(result.success());
    }
}
