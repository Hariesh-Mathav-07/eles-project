from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "student"

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class UserCreateAdmin(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # student, teacher, admin

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserRoleUpdate(BaseModel):
    role: str


# --- Material Schemas ---
class MaterialCreate(BaseModel):
    title: str
    content_type: str  # "document", "video", "link", "text"
    content_data: str
    order_index: Optional[int] = 1

class MaterialOut(BaseModel):
    id: int
    course_id: int
    title: str
    content_type: str
    content_data: str
    order_index: int
    created_at: datetime
    model_config = {"from_attributes": True}


# --- Quiz & Question Schemas ---
class QuizQuestionCreate(BaseModel):
    question_text: str
    options: List[str]
    correct_option_index: int
    points: Optional[int] = 1

class QuizQuestionOut(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    options: List[str]
    correct_option_index: int
    points: int

class QuizQuestionStudentOut(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    options: List[str]
    points: int

class QuizCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    time_limit_minutes: Optional[int] = 15
    passing_score: Optional[int] = 60
    questions: List[QuizQuestionCreate]

class QuizOut(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str]
    time_limit_minutes: int
    passing_score: int
    created_at: datetime
    questions_count: Optional[int] = 0
    model_config = {"from_attributes": True}

class QuizDetailOut(QuizOut):
    questions: List[QuizQuestionOut] = []

class QuizStudentDetailOut(QuizOut):
    questions: List[QuizQuestionStudentOut] = []

class QuizSubmitRequest(BaseModel):
    answers: Dict[int, int]  # {question_id: selected_index}

class QuizSubmissionOut(BaseModel):
    id: int
    quiz_id: int
    quiz_title: Optional[str] = ""
    student_id: int
    student_name: Optional[str] = ""
    score: int
    total_points: int
    percentage: float
    is_passed: bool
    answers: Dict[str, Any]
    submitted_at: datetime
    model_config = {"from_attributes": True}


# --- Course Schemas ---
class CourseCreate(BaseModel):
    code: str
    title: str
    description: str
    category: str
    thumbnail: Optional[str] = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60"
    is_published: Optional[bool] = True

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    thumbnail: Optional[str] = None
    is_published: Optional[bool] = None

class CourseOut(BaseModel):
    id: int
    code: str
    title: str
    description: str
    category: str
    thumbnail: str
    teacher_id: int
    teacher_name: Optional[str] = None
    is_published: bool
    created_at: datetime
    enrolled_count: Optional[int] = 0
    materials_count: Optional[int] = 0
    quizzes_count: Optional[int] = 0
    is_enrolled: Optional[bool] = False
    model_config = {"from_attributes": True}

class CourseDetailOut(CourseOut):
    materials: List[MaterialOut] = []
    quizzes: List[QuizOut] = []


# --- Reports & Analytics Schemas ---
class OverviewStats(BaseModel):
    total_students: int
    total_teachers: int
    total_courses: int
    total_enrollments: int
    total_quiz_submissions: int
    average_pass_rate: float

class CourseEnrollmentStat(BaseModel):
    course_id: int
    course_code: str
    course_title: str
    teacher_name: str
    enrolled_count: int

class QuizPerformanceStat(BaseModel):
    quiz_id: int
    quiz_title: str
    course_title: str
    total_attempts: int
    pass_count: int
    fail_count: int
    average_percentage: float
