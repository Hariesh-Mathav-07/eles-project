import io
import os
import csv
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query, Response
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, get_db, Base
from models import User, Course, Material, Quiz, QuizQuestion, Enrollment, QuizSubmission
from schemas import (
    UserRegister, UserLogin, UserOut, TokenResponse, UserCreateAdmin, UserStatusUpdate, UserRoleUpdate,
    CourseCreate, CourseUpdate, CourseOut, CourseDetailOut,
    MaterialCreate, MaterialOut,
    QuizCreate, QuizOut, QuizDetailOut, QuizStudentDetailOut, QuizQuestionStudentOut, QuizQuestionOut,
    QuizSubmitRequest, QuizSubmissionOut,
    OverviewStats, CourseEnrollmentStat, QuizPerformanceStat
)
from auth import hash_password, verify_password, create_access_token, get_current_user, get_optional_user, require_role
from seed import seed_database

from contextlib import asynccontextmanager

# Create DB tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield

app = FastAPI(
    title="E-Learning Education System (ELES) API",
    description="Backend API supporting 5 Epics and 15 User Stories for ELES",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite dev server & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Health Check
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "E-Learning Education System (ELES) API", "version": "1.0.0"}


# ==========================================
# REPORT & PROJECT DOWNLOAD ENDPOINTS
# ==========================================

ROOT_PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@app.get("/download/report.docx")
def download_docx_report():
    file_path = os.path.join(ROOT_PROJECT_DIR, "ELES_Project_Report.docx")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="DOCX report not found. Please run build_downloads.py.")
    return FileResponse(
        path=file_path,
        filename="ELES_Project_Report.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@app.get("/download/report.html")
def view_html_report():
    file_path = os.path.join(ROOT_PROJECT_DIR, "ELES_Project_Report.html")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="HTML report not found.")
    return FileResponse(path=file_path, media_type="text/html")

@app.get("/download/report.md")
def download_md_report():
    file_path = os.path.join(ROOT_PROJECT_DIR, "ELES_PROJECT_REPORT.md")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Markdown report not found.")
    return FileResponse(
        path=file_path,
        filename="ELES_PROJECT_REPORT.md",
        media_type="text/markdown"
    )

@app.get("/download/project.zip")
def download_project_zip():
    file_path = os.path.join(ROOT_PROJECT_DIR, "ELES_Complete_Project.zip")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="ZIP package not found.")
    return FileResponse(
        path=file_path,
        filename="ELES_Complete_Project.zip",
        media_type="application/zip"
    )


# ==========================================
# EPIC 1: USER AUTHENTICATION
# US-01: Student Login and Registration
# US-02: Teacher Login
# US-03: Admin Login
# ==========================================

@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_student(payload: UserRegister, db: Session = Depends(get_db)):
    """US-01: Student Registration"""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # Force role to student for self-registration to prevent privilege escalation
    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role="student",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"id": new_user.id, "sub": new_user.email, "role": new_user.role})
    return {"access_token": token, "token_type": "bearer", "user": new_user}


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """US-01, US-02, US-03: Unified Login for Student, Teacher, and Admin"""
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact the administrator."
        )

    token = create_access_token({"id": user.id, "sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/api/auth/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get authenticated user's profile and verified role"""
    return current_user


# ==========================================
# EPIC 2: STUDENT LEARNING
# US-04: Browse Courses
# US-05: Enroll in Course
# US-06: Access Learning Materials
# US-07: Attend Quiz
# US-08: View Results
# ==========================================

@app.get("/api/courses", response_model=List[CourseOut])
def browse_courses(
    search: Optional[str] = Query(None, description="Search term for title/code/description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """US-04: Browse published courses with search and filters"""
    query = db.query(Course).filter(Course.is_published == True)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Course.title.ilike(search_fmt)) |
            (Course.code.ilike(search_fmt)) |
            (Course.description.ilike(search_fmt))
        )
    if category and category != "All":
        query = query.filter(Course.category == category)

    courses = query.order_by(Course.created_at.desc()).all()

    # Pre-fetch user's enrollments if logged in
    user_enrolled_course_ids = set()
    if current_user and current_user.role == "student":
        enrollments = db.query(Enrollment.course_id).filter(Enrollment.student_id == current_user.id).all()
        user_enrolled_course_ids = {e[0] for e in enrollments}

    results = []
    for c in courses:
        enrolled_count = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == c.id).scalar()
        materials_count = db.query(func.count(Material.id)).filter(Material.course_id == c.id).scalar()
        quizzes_count = db.query(func.count(Quiz.id)).filter(Quiz.course_id == c.id).scalar()

        results.append(CourseOut(
            id=c.id,
            code=c.code,
            title=c.title,
            description=c.description,
            category=c.category,
            thumbnail=c.thumbnail,
            teacher_id=c.teacher_id,
            teacher_name=c.teacher.full_name if c.teacher else "Unknown",
            is_published=c.is_published,
            created_at=c.created_at,
            enrolled_count=enrolled_count or 0,
            materials_count=materials_count or 0,
            quizzes_count=quizzes_count or 0,
            is_enrolled=c.id in user_enrolled_course_ids
        ))
    return results


@app.get("/api/courses/categories", response_model=List[str])
def get_course_categories(db: Session = Depends(get_db)):
    """Get list of distinct course categories"""
    categories = db.query(Course.category).distinct().filter(Course.is_published == True).all()
    cats = [c[0] for c in categories if c[0]]
    return ["All"] + sorted(cats)


@app.get("/api/courses/{course_id}", response_model=CourseDetailOut)
def get_course_detail(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """View detailed course overview including curriculum preview"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    is_enrolled = False
    if current_user and current_user.role == "student":
        is_enrolled = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course.id
        ).first() is not None

    enrolled_count = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == course.id).scalar()

    materials = [
        MaterialOut(
            id=m.id,
            course_id=m.course_id,
            title=m.title,
            content_type=m.content_type,
            content_data=m.content_data,
            order_index=m.order_index,
            created_at=m.created_at
        ) for m in course.materials
    ]

    quizzes = [
        QuizOut(
            id=q.id,
            course_id=q.course_id,
            title=q.title,
            description=q.description,
            time_limit_minutes=q.time_limit_minutes,
            passing_score=q.passing_score,
            created_at=q.created_at,
            questions_count=len(q.questions)
        ) for q in course.quizzes
    ]

    return CourseDetailOut(
        id=course.id,
        code=course.code,
        title=course.title,
        description=course.description,
        category=course.category,
        thumbnail=course.thumbnail,
        teacher_id=course.teacher_id,
        teacher_name=course.teacher.full_name if course.teacher else "Unknown",
        is_published=course.is_published,
        created_at=course.created_at,
        enrolled_count=enrolled_count or 0,
        materials_count=len(materials),
        quizzes_count=len(quizzes),
        is_enrolled=is_enrolled,
        materials=materials,
        quizzes=quizzes
    )


@app.post("/api/courses/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    """US-05: Enroll in Course"""
    course = db.query(Course).filter(Course.id == course_id, Course.is_published == True).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or unpublished")

    existing = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if existing:
        return {"message": "Already enrolled in this course", "enrollment_id": existing.id}

    enrollment = Enrollment(student_id=current_user.id, course_id=course_id, progress_percent=0.0)
    db.add(enrollment)
    db.commit()
    return {"message": "Successfully enrolled in course", "enrollment_id": enrollment.id}


@app.post("/api/courses/{course_id}/unenroll")
def unenroll_from_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    """Unenroll from a course"""
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    db.delete(enrollment)
    db.commit()
    return {"message": "Successfully unenrolled from course"}


@app.get("/api/student/my-courses")
def get_student_enrolled_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    """Get all courses the authenticated student is currently enrolled in"""
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
    results = []
    for enr in enrollments:
        c = enr.course
        quizzes_count = db.query(func.count(Quiz.id)).filter(Quiz.course_id == c.id).scalar()
        materials_count = db.query(func.count(Material.id)).filter(Material.course_id == c.id).scalar()
        results.append({
            "enrollment_id": enr.id,
            "progress_percent": enr.progress_percent,
            "enrolled_at": enr.enrolled_at,
            "course": CourseOut(
                id=c.id,
                code=c.code,
                title=c.title,
                description=c.description,
                category=c.category,
                thumbnail=c.thumbnail,
                teacher_id=c.teacher_id,
                teacher_name=c.teacher.full_name if c.teacher else "Unknown",
                is_published=c.is_published,
                created_at=c.created_at,
                enrolled_count=0,
                materials_count=materials_count or 0,
                quizzes_count=quizzes_count or 0,
                is_enrolled=True
            )
        })
    return results


@app.get("/api/courses/{course_id}/materials", response_model=List[MaterialOut])
def access_course_materials(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """US-06: Access Learning Materials (for enrolled students, teachers, or admin)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Access control
    if current_user.role == "student":
        is_enrolled = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == course_id
        ).first()
        if not is_enrolled:
            raise HTTPException(status_code=403, detail="You must be enrolled in this course to access its learning materials")

    materials = db.query(Material).filter(Material.course_id == course_id).order_by(Material.order_index).all()
    return materials


@app.put("/api/student/courses/{course_id}/progress")
def update_student_progress(
    course_id: int,
    progress: float = Query(..., ge=0.0, le=100.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    """Update learning completion percentage for enrolled course"""
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    enrollment.progress_percent = progress
    db.commit()
    return {"message": "Progress updated", "progress_percent": progress}


@app.get("/api/quizzes/{quiz_id}", response_model=QuizStudentDetailOut)
def get_quiz_for_taking(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """US-07: Attend Quiz - fetch quiz and questions without revealing correct answer index"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # If student, verify enrollment
    if current_user.role == "student":
        is_enrolled = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == quiz.course_id
        ).first()
        if not is_enrolled:
            raise HTTPException(status_code=403, detail="You must enroll in this course to take the quiz")

    questions_out = []
    for q in quiz.questions:
        options = json.loads(q.options_json) if q.options_json else []
        questions_out.append(QuizQuestionStudentOut(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            options=options,
            points=q.points
        ))

    return QuizStudentDetailOut(
        id=quiz.id,
        course_id=quiz.course_id,
        title=quiz.title,
        description=quiz.description,
        time_limit_minutes=quiz.time_limit_minutes,
        passing_score=quiz.passing_score,
        created_at=quiz.created_at,
        questions_count=len(questions_out),
        questions=questions_out
    )


@app.post("/api/quizzes/{quiz_id}/submit", response_model=QuizSubmissionOut)
def submit_quiz_attempt(
    quiz_id: int,
    submission_data: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    """US-07 & US-08: Submit Quiz Answers, auto-evaluate, calculate percentage, and record result"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    total_points = 0
    earned_score = 0
    detailed_answers = {}

    for question in quiz.questions:
        total_points += question.points
        selected_option = submission_data.answers.get(question.id)
        is_correct = (selected_option is not None and selected_option == question.correct_option_index)

        if is_correct:
            earned_score += question.points

        options = json.loads(question.options_json) if question.options_json else []
        detailed_answers[str(question.id)] = {
            "question_text": question.question_text,
            "options": options,
            "selected_option": selected_option,
            "correct_option": question.correct_option_index,
            "is_correct": is_correct,
            "points_earned": question.points if is_correct else 0,
            "max_points": question.points
        }

    percentage = round((earned_score / total_points * 100), 2) if total_points > 0 else 0.0
    is_passed = percentage >= quiz.passing_score

    submission = QuizSubmission(
        quiz_id=quiz.id,
        student_id=current_user.id,
        score=earned_score,
        total_points=total_points,
        percentage=percentage,
        is_passed=is_passed,
        answers_json=json.dumps(detailed_answers)
    )
    db.add(submission)

    # Also automatically update enrollment progress on passing quiz
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == quiz.course_id
    ).first()
    if enrollment:
        enrollment.progress_percent = max(enrollment.progress_percent, 100.0 if is_passed else 50.0)

    db.commit()
    db.refresh(submission)

    return QuizSubmissionOut(
        id=submission.id,
        quiz_id=submission.quiz_id,
        quiz_title=quiz.title,
        student_id=submission.student_id,
        student_name=current_user.full_name,
        score=submission.score,
        total_points=submission.total_points,
        percentage=submission.percentage,
        is_passed=submission.is_passed,
        answers=detailed_answers,
        submitted_at=submission.submitted_at
    )


@app.get("/api/student/my-results", response_model=List[QuizSubmissionOut])
def get_student_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student"]))
):
    """US-08: View Results - Student's quiz attempt history and breakdown"""
    submissions = db.query(QuizSubmission).filter(
        QuizSubmission.student_id == current_user.id
    ).order_by(QuizSubmission.submitted_at.desc()).all()

    results = []
    for s in submissions:
        ans = json.loads(s.answers_json) if s.answers_json else {}
        results.append(QuizSubmissionOut(
            id=s.id,
            quiz_id=s.quiz_id,
            quiz_title=s.quiz.title if s.quiz else "Quiz",
            student_id=s.student_id,
            student_name=current_user.full_name,
            score=s.score,
            total_points=s.total_points,
            percentage=s.percentage,
            is_passed=s.is_passed,
            answers=ans,
            submitted_at=s.submitted_at
        ))
    return results


# ==========================================
# EPIC 3: TEACHER MANAGEMENT
# US-09: Create Course
# US-10: Upload Materials
# US-11: Create Quiz
# US-12: View Student Results
# ==========================================

@app.post("/api/teacher/courses", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    """US-09: Create Course"""
    existing = db.query(Course).filter(Course.code == course_in.code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A course with this code already exists")

    course = Course(
        code=course_in.code.strip().upper(),
        title=course_in.title.strip(),
        description=course_in.description.strip(),
        category=course_in.category.strip(),
        thumbnail=course_in.thumbnail or "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60",
        teacher_id=current_user.id,
        is_published=course_in.is_published
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    return CourseOut(
        id=course.id,
        code=course.code,
        title=course.title,
        description=course.description,
        category=course.category,
        thumbnail=course.thumbnail,
        teacher_id=course.teacher_id,
        teacher_name=current_user.full_name,
        is_published=course.is_published,
        created_at=course.created_at,
        enrolled_count=0,
        materials_count=0,
        quizzes_count=0,
        is_enrolled=False
    )


@app.put("/api/teacher/courses/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    course_in: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    """US-09: Edit Course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own courses")

    if course_in.title is not None:
        course.title = course_in.title.strip()
    if course_in.description is not None:
        course.description = course_in.description.strip()
    if course_in.category is not None:
        course.category = course_in.category.strip()
    if course_in.thumbnail is not None:
        course.thumbnail = course_in.thumbnail
    if course_in.is_published is not None:
        course.is_published = course_in.is_published

    db.commit()
    db.refresh(course)

    enrolled_count = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == course.id).scalar()
    materials_count = db.query(func.count(Material.id)).filter(Material.course_id == course.id).scalar()
    quizzes_count = db.query(func.count(Quiz.id)).filter(Quiz.course_id == course.id).scalar()

    return CourseOut(
        id=course.id,
        code=course.code,
        title=course.title,
        description=course.description,
        category=course.category,
        thumbnail=course.thumbnail,
        teacher_id=course.teacher_id,
        teacher_name=course.teacher.full_name if course.teacher else "Unknown",
        is_published=course.is_published,
        created_at=course.created_at,
        enrolled_count=enrolled_count or 0,
        materials_count=materials_count or 0,
        quizzes_count=quizzes_count or 0,
        is_enrolled=False
    )


@app.get("/api/teacher/my-courses", response_model=List[CourseOut])
def get_teacher_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    """US-09: Get all courses managed by authenticated teacher"""
    if current_user.role == "admin":
        courses = db.query(Course).order_by(Course.created_at.desc()).all()
    else:
        courses = db.query(Course).filter(Course.teacher_id == current_user.id).order_by(Course.created_at.desc()).all()

    results = []
    for c in courses:
        enrolled_count = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == c.id).scalar()
        materials_count = db.query(func.count(Material.id)).filter(Material.course_id == c.id).scalar()
        quizzes_count = db.query(func.count(Quiz.id)).filter(Quiz.course_id == c.id).scalar()
        results.append(CourseOut(
            id=c.id,
            code=c.code,
            title=c.title,
            description=c.description,
            category=c.category,
            thumbnail=c.thumbnail,
            teacher_id=c.teacher_id,
            teacher_name=c.teacher.full_name if c.teacher else "Unknown",
            is_published=c.is_published,
            created_at=c.created_at,
            enrolled_count=enrolled_count or 0,
            materials_count=materials_count or 0,
            quizzes_count=quizzes_count or 0,
            is_enrolled=False
        ))
    return results


@app.post("/api/courses/{course_id}/materials", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
def upload_course_material(
    course_id: int,
    material_in: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    """US-10: Upload / Add Materials to a Course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only add materials to your own courses")

    material = Material(
        course_id=course_id,
        title=material_in.title.strip(),
        content_type=material_in.content_type,
        content_data=material_in.content_data.strip(),
        order_index=material_in.order_index or 1
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@app.delete("/api/materials/{material_id}")
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    """Delete a course material"""
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    if current_user.role == "teacher" and mat.course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this material")

    db.delete(mat)
    db.commit()
    return {"message": "Material deleted successfully"}


@app.post("/api/courses/{course_id}/quizzes", response_model=QuizDetailOut, status_code=status.HTTP_201_CREATED)
def create_quiz(
    course_id: int,
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    """US-11: Create Quiz with questions and answer options"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only create quizzes for your own courses")

    quiz = Quiz(
        course_id=course_id,
        title=quiz_in.title.strip(),
        description=quiz_in.description.strip() if quiz_in.description else "",
        time_limit_minutes=quiz_in.time_limit_minutes or 15,
        passing_score=quiz_in.passing_score or 60
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    questions_out = []
    for q_data in quiz_in.questions:
        q = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.question_text.strip(),
            options_json=json.dumps(q_data.options),
            correct_option_index=q_data.correct_option_index,
            points=q_data.points or 1
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        questions_out.append(QuizQuestionOut(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            options=q_data.options,
            correct_option_index=q.correct_option_index,
            points=q.points
        ))

    return QuizDetailOut(
        id=quiz.id,
        course_id=quiz.course_id,
        title=quiz.title,
        description=quiz.description,
        time_limit_minutes=quiz.time_limit_minutes,
        passing_score=quiz.passing_score,
        created_at=quiz.created_at,
        questions_count=len(questions_out),
        questions=questions_out
    )


@app.get("/api/teacher/courses/{course_id}/submissions", response_model=List[QuizSubmissionOut])
def get_course_submissions(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    """US-12: View Student Results for a specific course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view submissions for this course")

    quiz_ids = [q.id for q in course.quizzes]
    submissions = db.query(QuizSubmission).filter(
        QuizSubmission.quiz_id.in_(quiz_ids)
    ).order_by(QuizSubmission.submitted_at.desc()).all()

    results = []
    for s in submissions:
        ans = json.loads(s.answers_json) if s.answers_json else {}
        results.append(QuizSubmissionOut(
            id=s.id,
            quiz_id=s.quiz_id,
            quiz_title=s.quiz.title if s.quiz else "Quiz",
            student_id=s.student_id,
            student_name=s.student.full_name if s.student else "Student",
            score=s.score,
            total_points=s.total_points,
            percentage=s.percentage,
            is_passed=s.is_passed,
            answers=ans,
            submitted_at=s.submitted_at
        ))
    return results


@app.get("/api/teacher/all-submissions", response_model=List[QuizSubmissionOut])
def get_all_teacher_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"]))
):
    """US-12: View all Student Results across all courses taught by this teacher"""
    if current_user.role == "admin":
        submissions = db.query(QuizSubmission).order_by(QuizSubmission.submitted_at.desc()).all()
    else:
        teacher_courses = db.query(Course.id).filter(Course.teacher_id == current_user.id).all()
        course_ids = [c[0] for c in teacher_courses]
        quizzes = db.query(Quiz.id).filter(Quiz.course_id.in_(course_ids)).all()
        quiz_ids = [q[0] for q in quizzes]
        submissions = db.query(QuizSubmission).filter(
            QuizSubmission.quiz_id.in_(quiz_ids)
        ).order_by(QuizSubmission.submitted_at.desc()).all()

    results = []
    for s in submissions:
        ans = json.loads(s.answers_json) if s.answers_json else {}
        results.append(QuizSubmissionOut(
            id=s.id,
            quiz_id=s.quiz_id,
            quiz_title=s.quiz.title if s.quiz else "Quiz",
            student_id=s.student_id,
            student_name=s.student.full_name if s.student else "Student",
            score=s.score,
            total_points=s.total_points,
            percentage=s.percentage,
            is_passed=s.is_passed,
            answers=ans,
            submitted_at=s.submitted_at
        ))
    return results


# ==========================================
# EPIC 4: ADMIN MANAGEMENT
# US-13: Manage Students & Teachers
# US-14: Manage Courses
# ==========================================

@app.get("/api/admin/users", response_model=List[UserOut])
def admin_list_users(
    role: Optional[str] = Query(None, description="Filter by role (student/teacher/admin)"),
    search: Optional[str] = Query(None, description="Filter by name or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """US-13: Manage Students & Teachers - List all system accounts"""
    query = db.query(User)
    if role and role != "All":
        query = query.filter(User.role == role)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter((User.full_name.ilike(search_fmt)) | (User.email.ilike(search_fmt)))

    return query.order_by(User.id.asc()).all()


@app.post("/api/admin/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    payload: UserCreateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """US-13: Admin create new account (Student, Teacher, or Admin)"""
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this email already exists")

    if payload.role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.put("/api/admin/users/{user_id}/status", response_model=UserOut)
def admin_update_user_status(
    user_id: int,
    status_in: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """US-13: Deactivate or activate user accounts"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own account")

    user.is_active = status_in.is_active
    db.commit()
    db.refresh(user)
    return user


@app.put("/api/admin/users/{user_id}/role", response_model=UserOut)
def admin_update_user_role(
    user_id: int,
    role_in: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """US-13: Change user role (e.g., promote student to teacher)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role_in.role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user.role = role_in.role
    db.commit()
    db.refresh(user)
    return user


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """US-13: Delete user account"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@app.get("/api/admin/courses", response_model=List[CourseOut])
def admin_list_all_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """US-14: Manage Courses - list all courses including drafts & unapproved"""
    courses = db.query(Course).order_by(Course.created_at.desc()).all()
    results = []
    for c in courses:
        enrolled_count = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == c.id).scalar()
        materials_count = db.query(func.count(Material.id)).filter(Material.course_id == c.id).scalar()
        quizzes_count = db.query(func.count(Quiz.id)).filter(Quiz.course_id == c.id).scalar()
        results.append(CourseOut(
            id=c.id,
            code=c.code,
            title=c.title,
            description=c.description,
            category=c.category,
            thumbnail=c.thumbnail,
            teacher_id=c.teacher_id,
            teacher_name=c.teacher.full_name if c.teacher else "Unknown",
            is_published=c.is_published,
            created_at=c.created_at,
            enrolled_count=enrolled_count or 0,
            materials_count=materials_count or 0,
            quizzes_count=quizzes_count or 0,
            is_enrolled=False
        ))
    return results


@app.put("/api/admin/courses/{course_id}/publish")
def admin_toggle_course_publish(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """US-14: Publish, unpublish or moderate courses"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.is_published = not course.is_published
    db.commit()
    return {"message": f"Course publish status set to {course.is_published}", "is_published": course.is_published}


@app.delete("/api/admin/courses/{course_id}")
def admin_delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """US-14: Delete course by administrator"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return {"message": "Course and related materials/quizzes deleted successfully"}


# ==========================================
# EPIC 5: RESULTS & REPORTS
# US-15: Generate Reports
# ==========================================

@app.get("/api/reports/overview", response_model=OverviewStats)
def get_overview_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """US-15: Executive overview metrics for reports"""
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar() or 0
    total_teachers = db.query(func.count(User.id)).filter(User.role == "teacher").scalar() or 0
    total_courses = db.query(func.count(Course.id)).scalar() or 0
    total_enrollments = db.query(func.count(Enrollment.id)).scalar() or 0
    total_quiz_submissions = db.query(func.count(QuizSubmission.id)).scalar() or 0

    passed_count = db.query(func.count(QuizSubmission.id)).filter(QuizSubmission.is_passed == True).scalar() or 0
    pass_rate = round((passed_count / total_quiz_submissions * 100), 1) if total_quiz_submissions > 0 else 0.0

    return OverviewStats(
        total_students=total_students,
        total_teachers=total_teachers,
        total_courses=total_courses,
        total_enrollments=total_enrollments,
        total_quiz_submissions=total_quiz_submissions,
        average_pass_rate=pass_rate
    )


@app.get("/api/reports/enrollments", response_model=List[CourseEnrollmentStat])
def get_course_enrollment_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """US-15: Course-by-course enrollment metrics report"""
    courses = db.query(Course).all()
    results = []
    for c in courses:
        count = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == c.id).scalar() or 0
        results.append(CourseEnrollmentStat(
            course_id=c.id,
            course_code=c.code,
            course_title=c.title,
            teacher_name=c.teacher.full_name if c.teacher else "Unknown",
            enrolled_count=count
        ))
    return results


@app.get("/api/reports/quiz-performance", response_model=List[QuizPerformanceStat])
def get_quiz_performance_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """US-15: Quiz performance, passing rate, and attempt metrics"""
    quizzes = db.query(Quiz).all()
    results = []
    for q in quizzes:
        submissions = db.query(QuizSubmission).filter(QuizSubmission.quiz_id == q.id).all()
        total_attempts = len(submissions)
        pass_count = sum(1 for s in submissions if s.is_passed)
        fail_count = total_attempts - pass_count
        avg_pct = round(sum(s.percentage for s in submissions) / total_attempts, 1) if total_attempts > 0 else 0.0

        results.append(QuizPerformanceStat(
            quiz_id=q.id,
            quiz_title=q.title,
            course_title=q.course.title if q.course else "Unknown",
            total_attempts=total_attempts,
            pass_count=pass_count,
            fail_count=fail_count,
            average_percentage=avg_pct
        ))
    return results


@app.get("/api/reports/export-csv")
def export_reports_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """US-15: Generate and export comprehensive CSV summary report"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Section 1: Overview
    writer.writerow(["=== ELES SYSTEM ANALYTICS SUMMARY REPORT ==="])
    writer.writerow([])
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar() or 0
    total_teachers = db.query(func.count(User.id)).filter(User.role == "teacher").scalar() or 0
    total_courses = db.query(func.count(Course.id)).scalar() or 0
    total_enrollments = db.query(func.count(Enrollment.id)).scalar() or 0

    writer.writerow(["Metric", "Count"])
    writer.writerow(["Total Registered Students", total_students])
    writer.writerow(["Total Registered Teachers", total_teachers])
    writer.writerow(["Total Active Courses", total_courses])
    writer.writerow(["Total Course Enrollments", total_enrollments])
    writer.writerow([])

    # Section 2: Course Enrollments
    writer.writerow(["=== COURSE ENROLLMENT BREAKDOWN ==="])
    writer.writerow(["Course ID", "Course Code", "Course Title", "Instructor", "Enrollments"])
    for c in db.query(Course).all():
        enr_cnt = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == c.id).scalar() or 0
        writer.writerow([c.id, c.code, c.title, c.teacher.full_name if c.teacher else "N/A", enr_cnt])
    writer.writerow([])

    # Section 3: Quiz Assessment Performance
    writer.writerow(["=== QUIZ EVALUATION & PASS RATES ==="])
    writer.writerow(["Quiz ID", "Quiz Title", "Course", "Total Attempts", "Passed", "Failed", "Average Score %"])
    for q in db.query(Quiz).all():
        subs = db.query(QuizSubmission).filter(QuizSubmission.quiz_id == q.id).all()
        attempts = len(subs)
        passed = sum(1 for s in subs if s.is_passed)
        failed = attempts - passed
        avg_score = round(sum(s.percentage for s in subs) / attempts, 1) if attempts > 0 else 0.0
        writer.writerow([q.id, q.title, q.course.title if q.course else "N/A", attempts, passed, failed, f"{avg_score}%"])

    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=eles_system_report.csv"}
    )
