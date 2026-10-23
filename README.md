# E-Learning Education System (ELES)

A full-stack e-learning management platform built with **Python (FastAPI)**, **SQLite**, and **React (Vite + Tailwind CSS)**.

The system covers 5 Epics and 15 User Stories with role-based access for Students, Teachers, and Administrators.

##  Epics and User Stories

### Epic 1: User Authentication
- **US-01: Student Login and Registration** — Student registration and secure login.
- **US-02: Teacher Login** — Teacher authentication and access to course management.
- **US-03: Admin Login** — Administrator access to users, courses, and reports.

### Epic 2: Student Learning
- **US-04: Browse Courses** — Search and filter available courses.
- **US-05: Enroll in Course** — Enroll in courses and view enrolled courses.
- **US-06: Access Learning Materials** — View lessons, notes, videos, and external resources; track lesson completion.
- **US-07: Attend Quiz** — Take timed multiple-choice quizzes and submit answers.
- **US-08: View Results** — View scores, pass/fail status, and previous quiz attempts.

### Epic 3: Teacher Management
- **US-09: Create Course** — Create and manage courses.
- **US-10: Upload Materials** — Add learning notes, documents, videos, and links.
- **US-11: Create Quiz** — Create quizzes with questions, options, marks, and time limits.
- **US-12: View Student Results** — Monitor student scores and submissions.

### Epic 4: Admin Management
- **US-13: Manage Students and Teachers** — Create, activate, deactivate, update roles, and remove accounts.
- **US-14: Manage Courses** — View, publish, unpublish, and remove courses.

### Epic 5: Results and Reports
- **US-15: Generate Reports** — View platform statistics, course enrollments, quiz performance, and export CSV reports.

##  Demo Test Accounts

The following are the documented demo credentials for the local project. Ensure these accounts exist in your database before testing.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@eles.edu` | `Admin@123` |
| Teacher | `teacher@eles.edu` | `Teacher@123` |
| Student | `student@eles.edu` | `Student@123` |
| Student | `sarah@eles.edu` | `Student@123` |

**Security note:** These are demo credentials. Do not use them for a public production deployment.

##  How to Run the Project

### 1. Start the FastAPI Backend

Open a terminal in the project root:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend URL: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

### 2. Start the React Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

### 3. Run Automated Tests

Open another terminal:

```bash
cd backend
pytest test_eles.py -v
```

Install `pytest` if required by your environment.

##  Project Directory Structure

```text
eles/
├── backend/
│   ├── auth.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── seed.py
│   ├── main.py
│   ├── test_eles.py
│   ├── requirements.txt
│   └── eles.db
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── AuthModal.jsx
│   │       ├── CourseCatalog.jsx
│   │       ├── CourseViewer.jsx
│   │       ├── QuizTakeModal.jsx
│   │       ├── StudentResults.jsx
│   │       ├── TeacherDashboard.jsx
│   │       ├── AdminDashboard.jsx
│   │       └── ReportsDashboard.jsx
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── ELES_Complete_Project.zip
├── ELES_Project_Report.docx
├── ELES_Project_Report.html
├── ELES_PROJECT_REPORT.md
├── README.md
├── start.bat
├── start.ps1
└── use_case_diagram.png
```

##  Technologies Used

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python, FastAPI
- **Database:** SQLite and SQLAlchemy
- **Authentication:** JWT-based authentication and password hashing
- **Testing:** Pytest

##  Deployment

The React frontend can be deployed to a static hosting service such as GitHub Pages. The FastAPI backend requires a separate server or backend hosting service. Configure the frontend API URL to point to the deployed backend before using backend-dependent features online.

##  Project Objective

The objective of ELES is to provide a centralized platform where students can access courses, study materials, quizzes, and results, while teachers manage educational content and administrators manage users, courses, and reports.