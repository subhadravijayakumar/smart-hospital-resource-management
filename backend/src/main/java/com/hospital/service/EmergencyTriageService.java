package com.hospital.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

/**
 * Emergency Triage Priority Queue Service
 *
 * Implements a real Java PriorityQueue with a composite clinical priority comparator:
 * PriorityScore = BaseSeverityScore + (WaitTimeMinutes * AgingFactor) + ICURquirementBonus
 */
public class EmergencyTriageService {

    public record EmergencyCaseDto(
        Long id,
        String caseNumber,
        String patientName,
        String emergencyType,
        String severity, // CRITICAL_1, EMERGENT_2, URGENT_3, LESS_URGENT_4, NON_URGENT_5
        LocalDateTime arrivalTime,
        String requiredBedType,
        String status
    ) {}

    public static class TriagedCase {
        private final EmergencyCaseDto caseData;
        private double calculatedPriority;
        private long waitTimeMinutes;

        public TriagedCase(EmergencyCaseDto caseData) {
            this.caseData = caseData;
            recalculatePriority(LocalDateTime.now());
        }

        public void recalculatePriority(LocalDateTime currentTime) {
            double baseScore = switch (caseData.severity()) {
                case "CRITICAL_1" -> 1000.0;
                case "EMERGENT_2" -> 750.0;
                case "URGENT_3" -> 500.0;
                case "LESS_URGENT_4" -> 250.0;
                default -> 100.0;
            };

            this.waitTimeMinutes = Math.max(0, Duration.between(caseData.arrivalTime(), currentTime).toMinutes());
            double agingBonus = waitTimeMinutes * 1.5; // +1.5 pts per min prevents triage starvation

            double icuBonus = "ICU".equalsIgnoreCase(caseData.requiredBedType()) ? 50.0 : 0.0;

            this.calculatedPriority = baseScore + agingBonus + icuBonus;
        }

        public EmergencyCaseDto getCaseData() { return caseData; }
        public double getCalculatedPriority() { return calculatedPriority; }
        public long getWaitTimeMinutes() { return waitTimeMinutes; }
    }

    private final PriorityQueue<TriagedCase> priorityQueue;

    public EmergencyTriageService() {
        // Higher score has higher priority (Max-Priority Queue)
        Comparator<TriagedCase> triageComparator = (a, b) -> Double.compare(b.getCalculatedPriority(), a.getCalculatedPriority());
        this.priorityQueue = new PriorityQueue<>(triageComparator);
    }

    public synchronized void enqueue(EmergencyCaseDto caseDto) {
        priorityQueue.offer(new TriagedCase(caseDto));
    }

    public synchronized TriagedCase dequeueNextCriticalCase() {
        return priorityQueue.poll();
    }

    public synchronized TriagedCase peek() {
        return priorityQueue.peek();
    }

    public synchronized int size() {
        return priorityQueue.size();
    }

    public synchronized List<TriagedCase> getOrderedQueue() {
        LocalDateTime now = LocalDateTime.now();
        List<TriagedCase> copy = new ArrayList<>(priorityQueue);
        copy.forEach(c -> c.recalculatePriority(now));
        copy.sort((a, b) -> Double.compare(b.getCalculatedPriority(), a.getCalculatedPriority()));
        return copy;
    }
}
