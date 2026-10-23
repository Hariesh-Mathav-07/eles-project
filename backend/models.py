from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # "student", "teacher", "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    taught_courses = relationship("Course", back_populates="teacher", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("QuizSubmission", back_populates="student", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="General", nullable=False)
    thumbnail = Column(String(500), default="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60")
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    teacher = relationship("User", back_populates="taught_courses")
    materials = relationship("Material", back_populates="course", cascade="all, delete-orphan", order_by="Material.order_index")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content_type = Column(String(50), default="text")  # "document", "video", "link", "text"
    content_data = Column(Text, nullable=False)  # URL or rich text/markdown
    order_index = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="materials")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    time_limit_minutes = Column(Integer, default=15)
    passing_score = Column(Integer, default=60)  # percentage
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    submissions = relationship("QuizSubmission", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False)  # JSON-encoded array of options e.g. ["A", "B", "C", "D"]
    correct_option_index = Column(Integer, nullable=False)  # 0-indexed
    points = Column(Integer, default=1)

    quiz = relationship("Quiz", back_populates="questions")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    progress_percent = Column(Float, default=0.0)
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)
    total_points = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    is_passed = Column(Boolean, nullable=False)
    answers_json = Column(Text, nullable=False)  # JSON-encoded dict {question_id: selected_index}
    submitted_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
