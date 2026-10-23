
import { useState } from "react";
import "./App.css";

const initialCourses = [
  { id: 1, name: "React Basics", teacher: "Arun", enrolled: false },
  { id: 2, name: "Python Programming", teacher: "Priya", enrolled: false },
  { id: 3, name: "Web Development", teacher: "Kumar", enrolled: false },
];

function App() {
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [courses, setCourses] = useState(initialCourses);
  const [newCourse, setNewCourse] = useState("");
  const [page, setPage] = useState("courses");
  const [score, setScore] = useState(null);

  function login(e) {
    e.preventDefault();
    if (name.trim()) setRole(role || "Student");
  }

  function addCourse(e) {
    e.preventDefault();
    if (!newCourse.trim()) return;

    setCourses([
      ...courses,
      {
        id: Date.now(),
        name: newCourse.trim(),
        teacher: name,
        enrolled: false,
      },
    ]);
    setNewCourse("");
  }

  function enroll(id) {
    setCourses(courses.map(course =>
      course.id === id ? { ...course, enrolled: true } : course
    ));
  }

  if (!role) {
    return (
      <div className="login">
        <h1>E-Learning System</h1>
        <p>Learn anytime, anywhere</p>
        <form onSubmit={login}>
          <input
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <select value={role} onChange={e => setRole(e.target.value)} required>
            <option value="">Select your role</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Admin">Admin</option>
          </select>
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h2>E-Learning System</h2>
        <span>Welcome, {name} ({role})</span>
        <button onClick={() => {
          setRole("");
          setPage("courses");
          setScore(null);
        }}>Logout</button>
      </header>

      <nav>
        <button onClick={() => setPage("courses")}>Courses</button>
        {role === "Student" && (
          <button onClick={() => setPage("quiz")}>Quiz</button>
        )}
        {(role === "Teacher" || role === "Admin") && (
          <button onClick={() => setPage("manage")}>Manage Courses</button>
        )}
        <button onClick={() => setPage("reports")}>Reports</button>
      </nav>

      <main>
        {page === "courses" && (
          <>
            <h2>{role === "Student" ? "Browse Courses" : "Available Courses"}</h2>
            <div className="grid">
              {courses.map(course => (
                <article key={course.id}>
                  <h3>{course.name}</h3>
                  <p>Teacher: {course.teacher}</p>
                  {role === "Student" && (
                    <button
                      disabled={course.enrolled}
                      onClick={() => enroll(course.id)}
                    >
                      {course.enrolled ? "Enrolled" : "Enroll"}
                    </button>
                  )}
                </article>
              ))}
            </div>
            {role === "Student" && (
              <p>
                Enrolled courses: {courses.filter(c => c.enrolled).length}
              </p>
            )}
          </>
        )}

        {page === "manage" && (
          <>
            <h2>Manage Courses</h2>
            {role === "Teacher" && (
              <form className="course-form" onSubmit={addCourse}>
                <input
                  placeholder="New course name"
                  value={newCourse}
                  onChange={e => setNewCourse(e.target.value)}
                  required
                />
                <button type="submit">Add Course</button>
              </form>
            )}
            {courses.map(course => (
              <p key={course.id}>{course.name} — {course.teacher}</p>
            ))}
            {role === "Admin" && (
              <p>Admin can review the available courses.</p>
            )}
          </>
        )}

        {page === "quiz" && (
          <>
            <h2>Sample Quiz</h2>
            <p>Which library is used to build this application's UI?</p>
            <button onClick={() => setScore(0)}>Angular</button>{" "}
            <button onClick={() => setScore(1)}>React</button>{" "}
            <button onClick={() => setScore(0)}>Django</button>
            {score !== null && <h3>Your score: {score}/1</h3>}
          </>
        )}

        {page === "reports" && (
          <>
            <h2>Course Reports</h2>
            <p>Total courses: {courses.length}</p>
            <p>Total enrollments: {courses.filter(c => c.enrolled).length}</p>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
