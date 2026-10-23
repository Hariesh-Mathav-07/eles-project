import json
from database import SessionLocal, engine, Base
from models import User, Course, Material, Quiz, QuizQuestion, Enrollment, QuizSubmission
from auth import hash_password

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already contains data. Skipping seed.")
        db.close()
        return

    print("Seeding database with initial users, courses, materials, quizzes, and submissions...")

    # 1. Users
    admin = User(
        email="admin@eles.edu",
        hashed_password=hash_password("Admin@123"),
        full_name="System Administrator",
        role="admin",
        is_active=True
    )
    teacher1 = User(
        email="teacher@eles.edu",
        hashed_password=hash_password("Teacher@123"),
        full_name="Prof. Robert Langdon",
        role="teacher",
        is_active=True
    )
    teacher2 = User(
        email="dr.elena@eles.edu",
        hashed_password=hash_password("Teacher@123"),
        full_name="Dr. Elena Vance",
        role="teacher",
        is_active=True
    )
    student1 = User(
        email="student@eles.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Alex Johnson",
        role="student",
        is_active=True
    )
    student2 = User(
        email="sarah@eles.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Sarah Connor",
        role="student",
        is_active=True
    )
    student3 = User(
        email="michael@eles.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Michael Chang",
        role="student",
        is_active=True
    )

    db.add_all([admin, teacher1, teacher2, student1, student2, student3])
    db.commit()

    # 2. Courses
    c1 = Course(
        code="CS101",
        title="Introduction to Python Programming & Data Science",
        description="Master the fundamentals of Python 3, algorithmic thinking, control flow, functions, OOP, and data analysis using NumPy and Pandas.",
        category="Computer Science",
        thumbnail="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60",
        teacher_id=teacher1.id,
        is_published=True
    )
    c2 = Course(
        code="WEB201",
        title="Modern Full-Stack Web Development with React & FastAPI",
        description="Learn how to architect, build, and deploy production-grade web applications utilizing modern React components, Vite, and asynchronous FastAPI microservices.",
        category="Web Development",
        thumbnail="https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&auto=format&fit=crop&q=60",
        teacher_id=teacher1.id,
        is_published=True
    )
    c3 = Course(
        code="AI301",
        title="Machine Learning & Neural Networks Foundations",
        description="Comprehensive introduction to supervised and unsupervised learning, mathematical optimization, gradient descent, loss functions, and PyTorch deep neural networks.",
        category="Artificial Intelligence",
        thumbnail="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=60",
        teacher_id=teacher2.id,
        is_published=True
    )
    c4 = Course(
        code="CYBER101",
        title="Cybersecurity Essentials & Network Defense",
        description="Understand key concepts in computer security: authentication protocols, cryptography, penetration testing basics, and OWASP Top 10 vulnerabilities.",
        category="Cybersecurity",
        thumbnail="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60",
        teacher_id=teacher2.id,
        is_published=True
    )

    db.add_all([c1, c2, c3, c4])
    db.commit()

    # 3. Learning Materials for CS101
    m1 = Material(
        course_id=c1.id,
        title="Module 1: Course Syllabus & Python 3 Setup",
        content_type="text",
        content_data="""# Welcome to CS101: Python Programming

### Prerequisites
- No prior programming experience required!
- A computer with Windows, macOS, or Linux.

### Course Objectives
1. Understand syntax, variables, conditionals, loops, and data types.
2. Master procedural programming and function composition.
3. Learn Object-Oriented Programming (Classes, Inheritance, Polymorphism).
4. Build practical automation scripts and analyze real datasets.

### Setting Up Your Environment
To get started:
1. Download Python 3.10+ from [python.org](https://www.python.org/downloads/).
2. Verify installation: `python --version`
3. Install VS Code and the official Python extension.
""",
        order_index=1
    )
    m2 = Material(
        course_id=c1.id,
        title="Module 2: Video Lecture - Variables, Loops & Functions",
        content_type="video",
        content_data="https://www.youtube.com/watch?v=kqtD5dpn9C8",
        order_index=2
    )
    m3 = Material(
        course_id=c1.id,
        title="Module 3: Python Data Structures Reference Sheet",
        content_type="document",
        content_data="""# Python Core Data Structures

- **Lists (`[]`)**: Ordered, mutable, allows duplicate items.
  `fruits = ["apple", "banana", "cherry"]`
- **Tuples (`()`)**: Ordered, immutable, allows duplicate items.
  `point = (10, 20)`
- **Sets (`{}`)**: Unordered, mutable, unique elements only.
  `tags = {"tech", "edu", "python"}`
- **Dictionaries (`{k: v}`)**: Key-value pairs, fast lookup O(1).
  `student = {"name": "Alex", "grade": "A"}`
""",
        order_index=3
    )

    # Materials for WEB201
    m4 = Material(
        course_id=c2.id,
        title="Full-Stack Web Architecture Overview",
        content_type="text",
        content_data="""# Full-Stack Web Architecture

In a modern single page application (SPA):
1. **Frontend (Client)**: Vite + React renders reactive UI components in the browser.
2. **REST API (Server)**: FastAPI handles HTTP requests, authentication, and business logic.
3. **Database (Persistence)**: Relational tables store users, courses, and transactional data.
4. **JWT Security**: Stateless bearer tokens verify user identity securely on every protected request.
""",
        order_index=1
    )

    db.add_all([m1, m2, m3, m4])
    db.commit()

    # 4. Quizzes and Questions
    q1 = Quiz(
        course_id=c1.id,
        title="CS101 Python Fundamentals Assessment",
        description="Test your understanding of core Python syntax, data structures, and control flow.",
        time_limit_minutes=15,
        passing_score=60
    )
    db.add(q1)
    db.commit()

    questions_c1 = [
        QuizQuestion(
            quiz_id=q1.id,
            question_text="Which of the following data types in Python is immutable?",
            options_json=json.dumps(["List", "Dictionary", "Tuple", "Set"]),
            correct_option_index=2,
            points=2
        ),
        QuizQuestion(
            quiz_id=q1.id,
            question_text="What keyword is used to define a function in Python?",
            options_json=json.dumps(["func", "def", "function", "lambda"]),
            correct_option_index=1,
            points=2
        ),
        QuizQuestion(
            quiz_id=q1.id,
            question_text="What will be the output of `bool([])` in Python?",
            options_json=json.dumps(["True", "False", "None", "IndexError"]),
            correct_option_index=1,
            points=2
        ),
        QuizQuestion(
            quiz_id=q1.id,
            question_text="Which module in the Python standard library is used for mathematical operations?",
            options_json=json.dumps(["math", "calc", "numbers", "algorithm"]),
            correct_option_index=0,
            points=2
        ),
        QuizQuestion(
            quiz_id=q1.id,
            question_text="How do you start a single-line comment in Python?",
            options_json=json.dumps(["//", "/*", "#", "<!--"]),
            correct_option_index=2,
            points=2
        )
    ]
    db.add_all(questions_c1)

    q2 = Quiz(
        course_id=c2.id,
        title="WEB201 Full-Stack Architecture Quiz",
        description="Validate your knowledge of React component state, REST verbs, and API security.",
        time_limit_minutes=10,
        passing_score=70
    )
    db.add(q2)
    db.commit()

    questions_c2 = [
        QuizQuestion(
            quiz_id=q2.id,
            question_text="What React hook is used to manage local component state?",
            options_json=json.dumps(["useEffect", "useContext", "useState", "useRef"]),
            correct_option_index=2,
            points=2
        ),
        QuizQuestion(
            quiz_id=q2.id,
            question_text="Which HTTP status code corresponds to 'Unauthorized'?",
            options_json=json.dumps(["400", "401", "403", "404"]),
            correct_option_index=1,
            points=2
        ),
        QuizQuestion(
            quiz_id=q2.id,
            question_text="What does CORS stand for in web security?",
            options_json=json.dumps(["Cross-Origin Resource Sharing", "Centralized Origin Routing System", "Client Online Resource Standard", "Cross-Object Request Socket"]),
            correct_option_index=0,
            points=2
        )
    ]
    db.add_all(questions_c2)
    db.commit()

    # 5. Enrollments
    e1 = Enrollment(student_id=student1.id, course_id=c1.id, progress_percent=75.0)
    e2 = Enrollment(student_id=student1.id, course_id=c2.id, progress_percent=30.0)
    e3 = Enrollment(student_id=student2.id, course_id=c1.id, progress_percent=100.0)
    e4 = Enrollment(student_id=student2.id, course_id=c3.id, progress_percent=50.0)
    e5 = Enrollment(student_id=student3.id, course_id=c1.id, progress_percent=40.0)
    db.add_all([e1, e2, e3, e4, e5])
    db.commit()

    # 6. Sample Quiz Submissions
    sub1 = QuizSubmission(
        quiz_id=q1.id,
        student_id=student1.id,
        score=8,
        total_points=10,
        percentage=80.0,
        is_passed=True,
        answers_json=json.dumps({
            str(questions_c1[0].id): 2,
            str(questions_c1[1].id): 1,
            str(questions_c1[2].id): 1,
            str(questions_c1[3].id): 0,
            str(questions_c1[4].id): 0  # wrong answer
        })
    )
    sub2 = QuizSubmission(
        quiz_id=q1.id,
        student_id=student2.id,
        score=10,
        total_points=10,
        percentage=100.0,
        is_passed=True,
        answers_json=json.dumps({
            str(questions_c1[0].id): 2,
            str(questions_c1[1].id): 1,
            str(questions_c1[2].id): 1,
            str(questions_c1[3].id): 0,
            str(questions_c1[4].id): 2
        })
    )
    db.add_all([sub1, sub2])
    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
