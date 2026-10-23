# E-Learning Education System (ELES)

A full-stack, enterprise-grade e-learning management platform built with **Python (FastAPI)**, **SQLite**, and **React (Vite + Tailwind CSS)**.

This system is organized around **5 Epics** and **15 User Stories** with full role-based access control (Student, Teacher, and Administrator).

---

## 📋 Epics and User Stories Coverage

### EPIC 1: User Authentication
- **US-01: Student Login and Registration**
  - Self-registration with email, password, and full name (`POST /api/auth/register`).
  - Secure JWT authentication with PBKDF2-HMAC salted password hashing (`POST /api/auth/login`).
- **US-02: Teacher Login**
  - Dedicated teacher authentication and role recognition redirecting to teacher course management.
- **US-03: Admin Login**
  - Elevated administrator authentication providing full oversight over user accounts, courses, and platform analytics.

### EPIC 2: Student Learning
- **US-04: Browse Courses**
  - Searchable course catalog by keyword, code, or description (`GET /api/courses?search=...`).
  - Category filtering across Computer Science, Web Development, Artificial Intelligence, and Cybersecurity.
- **US-05: Enroll in Course**
  - One-click course enrollment (`POST /api/courses/{id}/enroll`) and unenrollment.
  - Dedicated "My Enrolled Courses" dashboard tracking individual student progress.
- **US-06: Access Learning Materials**
  - Interactive modular curriculum reader for syllabus modules, formatted notes, video streams, and external resources (`GET /api/courses/{id}/materials`).
  - Interactive "Mark Lesson Complete" progress tracker.
- **US-07: Attend Quiz**
  - Timed multiple-choice assessments with interactive question navigation, radio selection, and timer countdown (`GET /api/quizzes/{id}`).
  - Instant submission and auto-scoring (`POST /api/quizzes/{id}/submit`).
- **US-08: View Results**
  - Immediate scorecard display (Points, Percentage, Pass/Fail status).
  - Detailed review highlighting correct answers versus student selections.
  - Historical quiz attempt ledger (`GET /api/student/my-results`).

### EPIC 3: Teacher Management
- **US-09: Create Course**
  - Course creator modal specifying course code, title, category, description, and status (`POST /api/teacher/courses`).
  - Teacher course management dashboard (`GET /api/teacher/my-courses`).
- **US-10: Upload Materials**
  - Modular material authoring: Text, Documents/Markdown, Video URLs, and Reference Links (`POST /api/courses/{id}/materials`).
- **US-11: Create Quiz**
  - Dynamic multi-question quiz builder with customized passing thresholds, time limits, options, and points (`POST /api/courses/{id}/quizzes`).
- **US-12: View Student Results**
  - Real-time gradebook and submission monitoring table displaying enrolled student scores and completion dates (`GET /api/teacher/all-submissions`).

### EPIC 4: Admin Management
- **US-13: Manage Students & Teachers**
  - Account provisioning modal to create students, teachers, or admins (`POST /api/admin/users`).
  - Activate/Deactivate accounts to moderate platform access (`PUT /api/admin/users/{id}/status`).
  - Role management (promote students to instructors or administrators) (`PUT /api/admin/users/{id}/role`).
  - Permanent account deletion (`DELETE /api/admin/users/{id}`).
- **US-14: Manage Courses**
  - Platform-wide course moderation catalog (`GET /api/admin/courses`).
  - One-click publish / unpublish toggle (`PUT /api/admin/courses/{id}/publish`).
  - Course moderation deletion (`DELETE /api/admin/courses/{id}`).

### EPIC 5: Results & Reports
- **US-15: Generate Reports**
  - Executive KPI cards: Total Students, Teachers, Courses, Enrollments, and Average Pass Rate (`GET /api/reports/overview`).
  - Course enrollment distribution table (`GET /api/reports/enrollments`).
  - Quiz evaluation metrics and pass/fail ratios (`GET /api/reports/quiz-performance`).
  - One-click comprehensive CSV report export (`GET /api/reports/export-csv`).

---

## 🔑 Pre-Seeded Demo Test Accounts

The SQLite database is pre-seeded with ready-to-test accounts. You can sign in using these credentials or click the **Demo Testing Quick-Switch** bar at the very top of the web UI:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@eles.edu` | `Admin@123` |
| **Teacher** | Prof. Robert Langdon | `teacher@eles.edu` | `Teacher@123` |
| **Student** | Alex Johnson | `student@eles.edu` | `Student@123` |
| **Student 2**| Sarah Connor | `sarah@eles.edu` | `Student@123` |

---

## 🚀 How to Run the Project

### 1. Start the FastAPI Backend
Open a terminal in `backend/`:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
- API will be accessible at: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

### 2. Start the React Frontend
Open a separate terminal in `frontend/`:
```bash
cd frontend
npm.cmd run dev
```
- Frontend application will be running at: `http://localhost:5173`

### 3. Run Automated Tests
To run the automated test suite verifying all 5 Epics:
```bash
cd backend
pytest test_eles.py -v
```

---

## 📁 Project Directory Structure

```text
eles/
├── backend/
│   ├── database.py       # SQLAlchemy engine & session setup
│   ├── models.py         # Relational schema (Users, Courses, Materials, Quizzes, Submissions)
│   ├── schemas.py        # Pydantic v2 data transfer schemas
│   ├── auth.py           # PBKDF2 password hashing & JWT bearer token validation
│   ├── seed.py           # Database initial seeder script
│   ├── main.py           # Complete FastAPI application with all 15 User Story routes
│   ├── test_eles.py      # Automated pytest suite testing Epics 1-5
│   ├── requirements.txt  # Python backend dependencies
│   └── eles.db           # SQLite database
├── frontend/
│   ├── src/
│   │   ├── api.js        # Centralized HTTP client
│   │   ├── App.jsx       # Main application container
│   │   ├── main.jsx      # React DOM bootstrap
│   │   ├── index.css     # Tailwind CSS styles
│   │   ├── context/
│   │   │   └── AuthContext.jsx # RBAC state management & quick demo switcher
│   │   └── components/
│   │       ├── Navbar.jsx           # Top navigation bar with role switcher
│   │       ├── AuthModal.jsx        # Login & registration modal (Epic 1)
│   │       ├── CourseCatalog.jsx    # Course search & enrollment (Epic 2)
│   │       ├── CourseViewer.jsx     # Curriculum reader & material viewer (Epic 2)
│   │       ├── QuizTakeModal.jsx    # Interactive assessment taker & results (Epic 2)
│   │       ├── StudentResults.jsx   # Results history & question breakdown (Epic 2)
│   │       ├── TeacherDashboard.jsx # Course, material & quiz management (Epic 3)
│   │       ├── AdminDashboard.jsx   # User management & moderation (Epic 4)
│   │       └── ReportsDashboard.jsx # Analytics dashboard & CSV export (Epic 5)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── start.bat             # 1-Click Windows batch runner
└── README.md             # Project documentation
```
