package com.hospital;

import com.hospital.service.EmergencyTriageService;
import com.hospital.service.EmergencyTriageService.EmergencyCaseDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class EmergencyTriageServiceTest {

    @Test
    @DisplayName("PriorityQueue must dequeue CRITICAL_1 before URGENT_3 regardless of insertion order")
    void testPriorityQueueOrdersBySeverity() {
        EmergencyTriageService triage = new EmergencyTriageService();

        // Enqueue less urgent case first
        triage.enqueue(new EmergencyCaseDto(
            1L, "EM-001", "Minor Injury Patient", "Sprained Ankle", "LESS_URGENT_4",
            LocalDateTime.now(), "GENERAL", "PENDING"
        ));

        // Enqueue moderate urgent case
        triage.enqueue(new EmergencyCaseDto(
            2L, "EM-002", "Asthma Patient", "Wheezing", "URGENT_3",
            LocalDateTime.now(), "EMERGENCY", "PENDING"
        ));

        // Enqueue critical resuscitation case last
        triage.enqueue(new EmergencyCaseDto(
            3L, "EM-003", "Cardiac Arrest Patient", "STEMI / Shock", "CRITICAL_1",
            LocalDateTime.now(), "ICU", "PENDING"
        ));

        // Dequeue should yield Level 1 first
        var firstOut = triage.dequeueNextCriticalCase();
        assertNotNull(firstOut);
        assertEquals("CRITICAL_1", firstOut.getCaseData().severity());
        assertEquals("Cardiac Arrest Patient", firstOut.getCaseData().patientName());

        var secondOut = triage.dequeueNextCriticalCase();
        assertNotNull(secondOut);
        assertEquals("URGENT_3", secondOut.getCaseData().severity());

        var thirdOut = triage.dequeueNextCriticalCase();
        assertNotNull(thirdOut);
        assertEquals("LESS_URGENT_4", thirdOut.getCaseData().severity());
    }
}
