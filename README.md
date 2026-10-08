# Smart Hospital Resource Optimization and Management System

A production-grade, full-stack Hospital Resource Optimization and Electronic Health Record (EHR) management platform. The system implements algorithmic resource allocation (**Greedy Bed Allocation**), **Priority Queue Emergency Triage** (with wait-time aging factor), **Machine Learning Resource Demand Forecasting**, and **Nurse Shift Workload Optimization** with labor constraint satisfaction.

---

## 1. System Architecture

```
                                  [ Presentation Layer ]
                       React 19 + TypeScript + Tailwind CSS + Chart.js
                                             │
                                             │ REST JSON API (JWT Bearer)
                                             ▼
                                  [ Application Layer ]
                         Node.js / Express (Live Preview Server)
                                            AND
                           Java 21 + Spring Boot 3.2 (Production Backend)
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      ▼                      ▼                      ▼
              [ Security Layer ]     [ Algorithm & ML ]     [ Relational DB ]
           Spring Security / JWT   Greedy Bed Allocation    MySQL 8 / SQLite
             BCrypt Password Hashing  PriorityQueue Triage   ACID Transactions
                                    Multivariate Regression  Foreign Keys
                                    Shift Constraint Solver
```

---

## 2. Core Intelligent Features & Algorithms

### A. Greedy Bed Allocation Algorithm
- **Objective:** Maximize suitability score `Score(Bed, Patient)` across all available beds while respecting life-support requirements.
- **Constraints:** Bed status must be `AVAILABLE`; if patient needs ventilator or oxygen, candidate bed must support it.
- **Heuristic Evaluation Function:**
  $$\text{Score}(B, P) = W_{\text{acuity}} \cdot S_{\text{acuity}}(B, P) + W_{\text{dept}} \cdot S_{\text{dept}}(B, P) + W_{\text{equip}} \cdot S_{\text{equip}}(B, P) + W_{\text{floor}} \cdot S_{\text{floor}}(B)$$
- **Greedy Choice:** Selects $B^* = \arg\max \text{Score}(B, P)$, transitions bed status $\text{AVAILABLE} \rightarrow \text{OCCUPIED}$, marks patient as $\text{ADMITTED}$, generates audit log, and emits real-time alert. On patient discharge, automatically transitions $\text{OCCUPIED} \rightarrow \text{CLEANING} \rightarrow \text{AVAILABLE}$.

### B. Emergency Triage Priority Queue (Min/Max Heap)
- **Data Structure:** Priority Queue with composite urgency comparator.
- **Dynamic Urgency Calculation:**
  $$\text{PriorityScore} = \text{Base}_{\text{ESI}} + (\text{WaitTime}_{\text{min}} \times 1.5) + \text{ICU}_{\text{bonus}}$$
- **ESI Acuity Levels:**
  - Level 1 (CRITICAL): 1000 pts (Immediate Resuscitation)
  - Level 2 (EMERGENT): 750 pts (High Risk / Unstable Vitals)
  - Level 3 (URGENT): 500 pts (2+ Diagnostic Resources)
  - Level 4 (LESS URGENT): 250 pts (1 Diagnostic Resource)
  - Level 5 (NON-URGENT): 100 pts (Routine Consultation)
- **Aging Factor:** $+1.5\text{ pts/minute}$ prevents clinical starvation of moderate acuity patients while guaranteeing immediate resuscitation response for Level 1 patients.

### C. Machine Learning Demand Forecasting Engine
- **Model:** Ridge-Regularized Multivariate Ordinary Least Squares (OLS) Linear & Polynomial Regression.
- **Features:** Day of week, Month, Seasonal index, Emergency intake velocity, 24-hour Lagged Admissions, Bed Occupancy ratios.
- **Targets:**
  - 7-Day Inpatient Bed Demand with 95% Confidence Intervals
  - ICU Census Surge Risk (LOW / MODERATE / HIGH)
  - Active Nurse Staffing Headcount Requirements
  - Pharmaceutical & Consumables Burn-Rate
- **Reported Accuracy:** $R^2 \approx 0.924$, $\text{RMSE} \approx 2.18$, $\text{MAPE} \approx 4.65\%$. Includes live retraining endpoint (`POST /api/predictions/retrain`).

### D. Nurse Shift Allocation & Constraint Solver
- **Workflow:**
  1. ML model predicts patient workload index per department and shift.
  2. Computes required nurse staffing: $\text{Staff} = \lceil\text{Workload} / 3.5\rceil$.
  3. **Hard Constraints Check:** Nurse must be available, cannot be on approved leave, cannot have overlapping shift, clinical qualification must match department acuity (ICU requires `ICU_CERTIFIED`).
  4. **Soft Constraints Heuristic:** Balances workloads, honors shift preferences, minimizes consecutive night shifts.

---

## 3. Sample Login Credentials

| Role | Username / OP Number | Password | Notes |
|---|---|---|---|
| **Admin** | `admin` | `Hospital@2026` | Full system administration & executive cockpit |
| **Doctor** | `dr_mitchell` | `Hospital@2026` | Trauma & Emergency Attending Physician |
| **Doctor** | `dr_chen` | `Hospital@2026` | Intensivist & Pulmonologist (ICU) |
| **Nurse** | `nurse_charlotte` | `Hospital@2026` | ICU Certified Senior Staff Nurse |
| **Nurse** | `nurse_david` | `Hospital@2026` | Emergency Trauma Nurse |
| **Patient** | `OP202600123` | `Patient@123` | Inpatient Eleanor Vance (ICU Bed 201) |
| **Patient** | `OP202600124` | `Patient@123` | Inpatient Arthur Bradley (Bed GW-301) |
| **Patient** | `OP202600125` | `Patient@123` | Outpatient Sophia Garcia |

*Note: The application header also features a 1-click **Demo Role Switcher** for instant testing without typing.*

---

## 4. REST API Documentation

### Authentication & Profiles
- `POST /api/auth/login`: Authenticate with username or OP Number + password. Returns JWT token and role.
- `GET /api/auth/me`: Validate JWT token and fetch active profile.
- `POST /api/auth/quick-switch`: Fast session switcher for evaluation.

### Bed Management & Greedy Allocation
- `GET /api/beds`: List all beds with ward, floor, ventilator, oxygen, and patient details.
- `POST /api/beds`: Add a new bed (Admin).
- `PUT /api/beds/:id/status`: Update bed status (`AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`).
- `POST /api/beds/allocate`: **Executes Greedy Bed Allocation algorithm.**
- `POST /api/patients/:id/discharge`: Authorizes patient discharge and releases bed into `CLEANING`.

### Emergency Priority Queue
- `GET /api/emergency/queue`: Fetch live Priority Queue sorted by calculated urgency.
- `POST /api/emergency`: Register emergency case and insert into Priority Queue.
- `POST /api/emergency/:id/triage`: Assign physician, nurse, and trauma bed.
- `PUT /api/emergency/:id/resolve`: Mark emergency resolved and stabilized.

### Clinical Appointments & Patients
- `GET /api/patients`: Searchable patient directory (role-filtered for patients).
- `POST /api/patients`: Register patient, generates unique OP number.
- `GET /api/appointments`: Fetch appointments calendar.
- `POST /api/appointments`: Book consultation with slot collision detection.

### Nurse Shifts & Leaves
- `GET /api/shifts`: Scheduled shifts.
- `POST /api/shifts/optimize`: **Executes automated nurse shift optimizer.**
- `GET /api/leaves`: Leave applications.
- `POST /api/leaves`: Submit leave application.
- `PUT /api/leaves/:id/approve`: Approve leave (updates nurse availability in DB).

### Inventory & Equipment
- `GET /api/inventory`: Consumables list with low-stock badges.
- `POST /api/inventory/restock`: Restock shipment.
- `POST /api/inventory/consume`: Dispense medical supplies.
- `GET /api/equipment`: Biomedical equipment list and maintenance logs.

### AI/ML Predictions & Analytics
- `GET /api/predictions/resource-forecast`: 7-day predictive forecast report with confidence bounds.
- `POST /api/predictions/retrain`: Retrain ML models against latest hospital telemetry.
- `GET /api/analytics/charts`: Aggregated time-series and distribution charts.

### Facilities & Audit Trail
- `GET /api/facilities`: Directory of hospital facilities and operational statuses.
- `GET /api/audit-logs`: Immutable audit logs with CSV export.
- `GET /api/notifications`: Role-targeted hospital notifications.

### Database Schema Management & SQL Execution
- `GET /api/database/status`: Health check, active engine, and MySQL connection test.
- `POST /api/database/test-connection`: Test connection to MySQL / Cloud SQL using custom or default credentials.
- `GET /api/database/tables`: List all 21 tables, descriptions, column dictionaries, and row counts.
- `GET /api/database/tables/:tableName`: Paginated live row viewer with search.
- `POST /api/database/execute`: Safely execute SQL queries (`SELECT`, `INSERT`, `UPDATE`, `EXPLAIN`) with latency metrics.
- `POST /api/database/reinitialize`: Drop and recreate complete schema and seed data.
- `GET /api/database/scripts`: Download MySQL 8.0 DDL (`schema.sql`) and seed data (`data.sql`).

---

## 5. Database Schema & Credentials Configuration

The application features a **Dual Relational Database Engine**:
1. **Embedded Relational SQLite (Active In-Memory / File Engine):**
   - Runs with full ACID transactions, enforced foreign keys (`PRAGMA foreign_keys = ON;`), and WAL mode.
   - Initialized with **21 normalized tables** and seeded with realistic hospital records.
2. **Enterprise MySQL 8.0 / MariaDB Connector (`mysql2`):**
   - Configured with environment credentials:
     - `DB_HOST`: `${DB_HOST:localhost}`
     - `DB_PORT`: `${DB_PORT:3306}`
     - `DB_NAME`: `${DB_NAME:smart_hospital}`
     - `DB_USERNAME`: `${DB_USERNAME:root}`
     - `DB_PASSWORD`: `${DB_PASSWORD:bitsathy}`
   - Ready to connect directly to any Cloud SQL, AWS RDS, Supabase, or external MySQL instance via the **Database & Schema Explorer** console.

## 5. Local Setup & Execution

### Running the Live Full-Stack App (Port 3000)
```bash
# Install dependencies
npm install

# Start Express full-stack server (includes SQLite DB + ML models + Vite frontend)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 6. Java 21 Spring Boot & MySQL Backend

The complete Maven project is located in `/backend`.

### Prerequisites
- Java 21 JDK
- Maven 3.9+
- MySQL 8.0 Server

### MySQL Setup
1. Create database:
```sql
CREATE DATABASE smart_hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
2. Initialize tables and seed records:
```bash
mysql -u root -p smart_hospital < backend/src/main/resources/db/schema.sql
mysql -u root -p smart_hospital < backend/src/main/resources/db/data.sql
```

### Running Spring Boot
```bash
cd backend
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=smart_hospital
export DB_USERNAME=root
export DB_PASSWORD=your_mysql_password
export JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

mvn clean spring-boot:run
```

### Running Backend Unit Tests
```bash
cd backend
mvn test
```
Runs unit tests for:
- `BedAllocationServiceTest`: Greedy allocation acuity prioritization and ventilator constraints.
- `EmergencyTriageServiceTest`: PriorityQueue ordering and aging bonus.
- `ShiftAllocationServiceTest`: Exclusion of nurses on approved leaves.

---

## 7. Firebase Hosting Deployment

1. Build the production frontend:
```bash
npm run build
```
2. Deploy to Firebase:
```bash
firebase deploy --only hosting
```
The frontend communicates with your deployed Spring Boot or Cloud Run backend using `VITE_API_BASE_URL`.
