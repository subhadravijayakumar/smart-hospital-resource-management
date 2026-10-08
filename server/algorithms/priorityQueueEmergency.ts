import { db } from '../db.ts';

export interface EmergencyPatientItem {
  id: number;
  case_number: string;
  patient_id?: number;
  patient_name: string;
  emergency_type: string;
  severity: 'CRITICAL_1' | 'EMERGENT_2' | 'URGENT_3' | 'LESS_URGENT_4' | 'NON_URGENT_5';
  triage_score: number;
  arrival_time: string;
  assigned_doctor_id?: number;
  assigned_doctor_name?: string;
  assigned_nurse_id?: number;
  assigned_nurse_name?: string;
  required_bed_type: string;
  status: 'PENDING' | 'TRIAGED' | 'IN_TREATMENT' | 'RESOLVED';
  triage_notes?: string;
  calculated_priority?: number; // Higher number = higher urgency
  wait_time_minutes?: number;
}

/**
 * Real Priority Queue implementation using a Max-Heap structure
 * Priority calculation:
 * Base severity:
 *   Level 1 (CRITICAL_1): 1000 pts (Immediate life threat)
 *   Level 2 (EMERGENT_2): 750 pts (High risk, vitals unstable)
 *   Level 3 (URGENT_3):   500 pts (Needs 2+ resources)
 *   Level 4 (LESS_URGENT_4): 250 pts (Needs 1 resource)
 *   Level 5 (NON_URGENT_5):  100 pts (Routine prescription/check)
 *
 * Aging adjustment:
 *   + 1.5 points per minute of waiting time to prevent clinical starvation of lower tiers
 */
export class EmergencyPriorityQueue {
  private heap: EmergencyPatientItem[] = [];

  constructor(items?: EmergencyPatientItem[]) {
    if (items) {
      for (const item of items) {
        this.enqueue(item);
      }
    }
  }

  public calculatePriorityScore(item: EmergencyPatientItem): number {
    let base = 100;
    switch (item.severity) {
      case 'CRITICAL_1': base = 1000; break;
      case 'EMERGENT_2': base = 750; break;
      case 'URGENT_3': base = 500; break;
      case 'LESS_URGENT_4': base = 250; break;
      case 'NON_URGENT_5': base = 100; break;
    }

    // Compute wait time in minutes
    const arrival = new Date(item.arrival_time).getTime();
    const now = Date.now();
    const waitMinutes = Math.max(0, Math.floor((now - arrival) / 60000));
    item.wait_time_minutes = waitMinutes;

    // Aging factor: 1.5 per minute
    const agingBonus = waitMinutes * 1.5;

    // Special equipment multiplier
    let equipBonus = 0;
    if (item.required_bed_type === 'ICU') equipBonus += 50;

    const totalPriority = base + agingBonus + equipBonus;
    item.calculated_priority = totalPriority;
    return totalPriority;
  }

  public enqueue(item: EmergencyPatientItem): void {
    this.calculatePriorityScore(item);
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  public dequeue(): EmergencyPatientItem | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.siftDown(0);
    }
    return top;
  }

  public peek(): EmergencyPatientItem | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  public size(): number {
    return this.heap.length;
  }

  public getSortedQueue(): EmergencyPatientItem[] {
    // Clone and sort descending by priority score
    const cloned = [...this.heap];
    for (const item of cloned) {
      this.calculatePriorityScore(item);
    }
    return cloned.sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0));
  }

  private siftUp(index: number): void {
    let parent = Math.floor((index - 1) / 2);
    while (index > 0 && (this.heap[index].calculated_priority || 0) > (this.heap[parent].calculated_priority || 0)) {
      [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
      index = parent;
      parent = Math.floor((index - 1) / 2);
    }
  }

  private siftDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let largest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && (this.heap[left].calculated_priority || 0) > (this.heap[largest].calculated_priority || 0)) {
        largest = left;
      }
      if (right < length && (this.heap[right].calculated_priority || 0) > (this.heap[largest].calculated_priority || 0)) {
        largest = right;
      }

      if (largest !== index) {
        [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
        index = largest;
      } else {
        break;
      }
    }
  }
}

/**
 * Fetch and construct current active Emergency Priority Queue from database
 */
export function getLiveEmergencyPriorityQueue(): EmergencyPatientItem[] {
  const rows = db.prepare(`
    SELECT e.*, d.name as assigned_doctor_name, n.name as assigned_nurse_name
    FROM emergency_cases e
    LEFT JOIN doctors d ON e.assigned_doctor_id = d.id
    LEFT JOIN nurses n ON e.assigned_nurse_id = n.id
    WHERE e.status IN ('PENDING', 'TRIAGED', 'IN_TREATMENT')
  `).all() as unknown as EmergencyPatientItem[];

  const pq = new EmergencyPriorityQueue(rows);
  return pq.getSortedQueue();
}
