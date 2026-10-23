import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  BookOpen,
  FileText,
  HelpCircle,
  Users,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Clock,
  Sparkles,
  ExternalLink,
  Upload
} from 'lucide-react';

export default function TeacherDashboard({ onSelectCourse }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'submissions'
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState(null);

  // Create Course Form State
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('Computer Science');

  // Add Material Form State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('text');
  const [materialContent, setMaterialContent] = useState('');

  // Create Quiz Form State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizTime, setQuizTime] = useState(15);
  const [quizPassingScore, setQuizPassingScore] = useState(60);
  const [questions, setQuestions] = useState([
    {
      question_text: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
      points: 2
    }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesData, subsData] = await Promise.all([
        api.getTeacherCourses(),
        api.getTeacherSubmissions()
      ]);
      setCourses(coursesData);
      setSubmissions(subsData);
    } catch (err) {
      console.error('Teacher dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler: Create Course (US-09)
  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createCourse({
        code: courseCode,
        title: courseTitle,
        description: courseDescription,
        category: courseCategory,
        is_published: true
      });
      setIsCourseModalOpen(false);
      setCourseCode('');
      setCourseTitle('');
      setCourseDescription('');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create course');
    }
  };

  // Handler: Add Material (US-10)
  const handleAddMaterialSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addMaterial(targetCourseId, {
        title: materialTitle,
        content_type: materialType,
        content_data: materialContent,
        order_index: 1
      });
      setIsMaterialModalOpen(false);
      setMaterialTitle('');
      setMaterialContent('');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to upload material');
    }
  };

  // Handler: Add Question to Quiz
  const handleAddQuestionSlot = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['', '', '', ''],
        correct_option_index: 0,
        points: 2
      }
    ]);
  };

  // Handler: Create Quiz (US-11)
  const handleCreateQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createQuiz(targetCourseId, {
        title: quizTitle,
        description: quizDesc,
        time_limit_minutes: Number(quizTime),
        passing_score: Number(quizPassingScore),
        questions
      });
      setIsQuizModalOpen(false);
      setQuizTitle('');
      setQuizDesc('');
      setQuestions([
        {
          question_text: '',
          options: ['', '', '', ''],
          correct_option_index: 0,
          points: 2
        }
      ]);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create quiz');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Management Workspace</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your academic courses, publish lecture materials, author quizzes, and track enrolled students.
          </p>
        </div>

        <button
          onClick={() => setIsCourseModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${
            activeTab === 'courses' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>My Taught Courses ({courses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${
            activeTab === 'submissions' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Submissions ({submissions.length})</span>
        </button>
      </div>

      {/* Tab 1: Course Management (US-09, US-10, US-11) */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2" />
              <p className="text-xs text-slate-500">Loading your courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Courses Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Click the 'Create New Course' button to author your first course, add materials, and create quizzes.
              </p>
              <button
                onClick={() => setIsCourseModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {course.code}
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {course.category}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-2">{course.title}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        course.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{course.description}</p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="block text-sm font-black text-slate-800">{course.enrolled_count}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Students</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="block text-sm font-black text-slate-800">{course.materials_count}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Materials</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="block text-sm font-black text-slate-800">{course.quizzes_count}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Quizzes</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectCourse(course.id)}
                      className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center space-x-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Course</span>
                    </button>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setTargetCourseId(course.id);
                          setIsMaterialModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs flex items-center space-x-1"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Add Material</span>
                      </button>

                      <button
                        onClick={() => {
                          setTargetCourseId(course.id);
                          setIsQuizModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Create Quiz</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Student Results (US-12: View Student Results) */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Enrolled Student Quiz Attempts</h3>
              <p className="text-xs text-slate-500">Track scores, completion rates, and pass/fail status across your classes.</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {submissions.length} Total Submissions
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No quiz submissions recorded yet for your courses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Quiz Title</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submission Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.student_name}</td>
                      <td className="py-3 px-4 font-medium">{s.quiz_title}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{s.score} / {s.total_points}</td>
                      <td className="py-3 px-4 font-bold">{s.percentage}%</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.is_passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.is_passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{s.is_passed ? 'Passed' : 'Failed'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{new Date(s.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create Course Modal (US-09) */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create New Course (US-09)</h3>
            <form onSubmit={handleCreateCourseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS102"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Algorithms and Problem Solving"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Data Science">Data Science</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed course description..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Material Modal (US-10) */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Upload Learning Material (US-10)</h3>
            <form onSubmit={handleAddMaterialSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Module / Lesson Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1: Introduction to Graph Theory"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Type</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="text">Formatted Text / Syllabus</option>
                  <option value="document">Lecture Document / Markdown</option>
                  <option value="video">Video Stream URL</option>
                  <option value="link">External Resource Link</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {materialType === 'video' || materialType === 'link' ? 'Resource URL' : 'Content / Lesson Notes'}
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder={
                    materialType === 'video'
                      ? 'https://www.youtube.com/watch?v=...'
                      : 'Type lecture notes, syllabus, explanations, or code examples...'
                  }
                  value={materialContent}
                  onChange={(e) => setMaterialContent(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Upload Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Quiz Modal (US-11) */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-100 p-6 flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Create Quiz Assessment (US-11)</h3>
            <div className="overflow-y-auto flex-1 pr-1">
              <form id="quiz-builder-form" onSubmit={handleCreateQuizSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Quiz Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Midterm Concepts Assessment"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Time Limit (Minutes)</label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={quizTime}
                      onChange={(e) => setQuizTime(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Score (%)</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={quizPassingScore}
                      onChange={(e) => setQuizPassingScore(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Questions Dynamic Builder */}
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Questions Bank</h4>
                    <button
                      type="button"
                      onClick={handleAddQuestionSlot}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-bold"
                    >
                      + Add Question
                    </button>
                  </div>

                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">Question {qIndex + 1}</span>
                        <div className="flex items-center space-x-2">
                          <label className="text-[10px] text-slate-500">Points:</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={q.points}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIndex].points = Number(e.target.value);
                              setQuestions(updated);
                            }}
                            className="w-12 p-1 border rounded text-center text-xs"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Enter the question prompt..."
                        value={q.question_text}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex].question_text = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full p-2 border rounded-lg bg-white"
                      />

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Answer Options & Correct Pick:</span>
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct_${qIndex}`}
                              checked={q.correct_option_index === optIndex}
                              onChange={() => {
                                const updated = [...questions];
                                updated[qIndex].correct_option_index = optIndex;
                                setQuestions(updated);
                              }}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <input
                              type="text"
                              required
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              value={opt}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIndex].options[optIndex] = e.target.value;
                                setQuestions(updated);
                              }}
                              className="flex-1 p-1.5 border rounded bg-white text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsQuizModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="quiz-builder-form"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Save & Publish Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
