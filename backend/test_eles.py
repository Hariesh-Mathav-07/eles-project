import uuid
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_epic1_user_authentication():
    uid = uuid.uuid4().hex[:6]
    # US-01: Student Registration
    reg_res = client.post("/api/auth/register", json={
        "email": f"new.student_{uid}@eles.edu",
        "password": "Password@123",
        "full_name": "New Student"
    })
    assert reg_res.status_code == 201
    assert "access_token" in reg_res.json()
    assert reg_res.json()["user"]["role"] == "student"

    # US-01: Student Login
    stu_res = client.post("/api/auth/login", json={
        "email": "student@eles.edu",
        "password": "Student@123"
    })
    assert stu_res.status_code == 200
    assert stu_res.json()["user"]["role"] == "student"

    # US-02: Teacher Login
    teacher_res = client.post("/api/auth/login", json={
        "email": "teacher@eles.edu",
        "password": "Teacher@123"
    })
    assert teacher_res.status_code == 200
    assert teacher_res.json()["user"]["role"] == "teacher"

    # US-03: Admin Login
    admin_res = client.post("/api/auth/login", json={
        "email": "admin@eles.edu",
        "password": "Admin@123"
    })
    assert admin_res.status_code == 200
    assert admin_res.json()["user"]["role"] == "admin"


def test_epic2_student_learning():
    # Login as student
    stu_login = client.post("/api/auth/login", json={
        "email": "student@eles.edu",
        "password": "Student@123"
    }).json()
    token = stu_login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # US-04: Browse Courses
    res = client.get("/api/courses", headers=headers)
    assert res.status_code == 200
    courses = res.json()
    assert len(courses) >= 4

    # Search filter
    search_res = client.get("/api/courses?search=Python", headers=headers)
    assert search_res.status_code == 200
    assert any("Python" in c["title"] for c in search_res.json())

    # US-05: Enroll in Course
    # Target CS101 or AI301
    course_to_enroll = next(c for c in courses if c["code"] == "CYBER101")
    enroll_res = client.post(f"/api/courses/{course_to_enroll['id']}/enroll", headers=headers)
    assert enroll_res.status_code == 200

    # Check My Courses
    my_courses_res = client.get("/api/student/my-courses", headers=headers)
    assert my_courses_res.status_code == 200
    assert any(item["course"]["code"] == "CYBER101" for item in my_courses_res.json())

    # US-06: Access Learning Materials
    cs101 = next(c for c in courses if c["code"] == "CS101")
    materials_res = client.get(f"/api/courses/{cs101['id']}/materials", headers=headers)
    assert materials_res.status_code == 200
    assert len(materials_res.json()) >= 2

    # US-07: Attend Quiz
    detail_res = client.get(f"/api/courses/{cs101['id']}", headers=headers)
    quizzes = detail_res.json()["quizzes"]
    assert len(quizzes) > 0
    quiz_id = quizzes[0]["id"]

    quiz_res = client.get(f"/api/quizzes/{quiz_id}", headers=headers)
    assert quiz_res.status_code == 200
    quiz_data = quiz_res.json()
    # Confirm answers are not leaked to student
    assert "correct_option_index" not in quiz_data["questions"][0]

    # Submit Quiz
    answers = {q["id"]: 2 for q in quiz_data["questions"]}  # Select option 2 for each
    submit_res = client.post(f"/api/quizzes/{quiz_id}/submit", json={"answers": answers}, headers=headers)
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert "score" in sub_data
    assert "percentage" in sub_data
    assert "is_passed" in sub_data

    # US-08: View Results
    results_res = client.get("/api/student/my-results", headers=headers)
    assert results_res.status_code == 200
    assert len(results_res.json()) > 0


def test_epic3_teacher_management():
    uid = uuid.uuid4().hex[:6]
    # Login as teacher
    teacher_login = client.post("/api/auth/login", json={
        "email": "teacher@eles.edu",
        "password": "Teacher@123"
    }).json()
    token = teacher_login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # US-09: Create Course
    new_course_res = client.post("/api/teacher/courses", json={
        "code": f"DS{uid.upper()}",
        "title": "Data Structures & Algorithms in Practice",
        "description": "Essential structures and algorithms for engineering interviews.",
        "category": "Computer Science",
        "thumbnail": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60",
        "is_published": True
    }, headers=headers)
    assert new_course_res.status_code == 201
    course_id = new_course_res.json()["id"]

    # US-10: Upload Materials
    mat_res = client.post(f"/api/courses/{course_id}/materials", json={
        "title": "Trees and Binary Search Trees Guide",
        "content_type": "text",
        "content_data": "# BST Notes and Implementations",
        "order_index": 1
    }, headers=headers)
    assert mat_res.status_code == 201

    # US-11: Create Quiz
    quiz_res = client.post(f"/api/courses/{course_id}/quizzes", json={
        "title": "DSA Checkpoint 1",
        "description": "Mid-term checkpoint on asymptotic notation",
        "time_limit_minutes": 20,
        "passing_score": 70,
        "questions": [
            {
                "question_text": "What is the average time complexity of searching in a balanced BST?",
                "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
                "correct_option_index": 2,
                "points": 5
            }
        ]
    }, headers=headers)
    assert quiz_res.status_code == 201

    # US-12: View Student Results
    submissions_res = client.get("/api/teacher/all-submissions", headers=headers)
    assert submissions_res.status_code == 200
    assert isinstance(submissions_res.json(), list)


def test_epic4_admin_management():
    uid = uuid.uuid4().hex[:6]
    # Login as admin
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@eles.edu",
        "password": "Admin@123"
    }).json()
    token = admin_login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # US-13: Manage Students & Teachers - List users
    users_res = client.get("/api/admin/users", headers=headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 6

    # US-13: Create User as Admin
    create_res = client.post("/api/admin/users", json={
        "email": f"instructor.{uid}@eles.edu",
        "password": "Teacher@123",
        "full_name": "Prof. Alan Davis",
        "role": "teacher"
    }, headers=headers)
    assert create_res.status_code == 201
    new_user_id = create_res.json()["id"]

    # US-13: Update User Status (Toggle Active)
    status_res = client.put(f"/api/admin/users/{new_user_id}/status", json={"is_active": False}, headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["is_active"] is False

    # US-14: Manage Courses
    courses_res = client.get("/api/admin/courses", headers=headers)
    assert courses_res.status_code == 200
    first_course = courses_res.json()[0]

    # Toggle publish status
    toggle_res = client.put(f"/api/admin/courses/{first_course['id']}/publish", headers=headers)
    assert toggle_res.status_code == 200
    assert "is_published" in toggle_res.json()


def test_epic5_results_and_reports():
    # Login as admin
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@eles.edu",
        "password": "Admin@123"
    }).json()
    headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    # US-15: Generate Reports - Overview
    overview_res = client.get("/api/reports/overview", headers=headers)
    assert overview_res.status_code == 200
    overview = overview_res.json()
    assert "total_students" in overview
    assert "total_teachers" in overview
    assert "total_courses" in overview
    assert "average_pass_rate" in overview

    # US-15: Course Enrollments report
    enroll_rep_res = client.get("/api/reports/enrollments", headers=headers)
    assert enroll_rep_res.status_code == 200
    assert len(enroll_rep_res.json()) > 0

    # US-15: Quiz Performance report
    quiz_rep_res = client.get("/api/reports/quiz-performance", headers=headers)
    assert quiz_rep_res.status_code == 200
    assert len(quiz_rep_res.json()) > 0

    # US-15: Export CSV report
    csv_res = client.get("/api/reports/export-csv", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "ELES SYSTEM ANALYTICS SUMMARY REPORT" in csv_res.text
