import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  FileText,
  Video,
  Link as LinkIcon,
  HelpCircle,
  PlayCircle,
  Lock,
  Clock,
  Award
} from 'lucide-react';

export default function CourseViewer({ courseId, onBack, onOpenQuiz }) {
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const data = await api.getCourseDetail(courseId);
      setCourse(data);
      if (data.materials && data.materials.length > 0) {
        setSelectedMaterial(data.materials[0]);
      }
    } catch (err) {
      console.error('Failed to fetch course details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!user) {
      alert('Please log in as a student to enroll');
      return;
    }
    setEnrollLoading(true);
    try {
      await api.enrollCourse(courseId);
      await fetchCourseData();
    } catch (err) {
      alert(err.message || 'Enrollment failed');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleMarkProgress = async (pct) => {
    try {
      await api.updateCourseProgress(courseId, pct);
      await fetchCourseData();
    } catch (err) {
      alert(err.message || 'Progress update failed');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2" />
        <p className="text-sm text-slate-500">Loading course curriculum...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600">Course not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          Return to Catalog
        </button>
      </div>
    );
  }

  const isAccessAllowed = user?.role === 'teacher' || user?.role === 'admin' || course.is_enrolled;

  const renderMaterialIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-emerald-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>

        {user?.role === 'student' && !course.is_enrolled && (
          <button
            onClick={handleEnroll}
            disabled={enrollLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{enrollLoading ? 'Enrolling...' : 'Enroll in Course (Free)'}</span>
          </button>
        )}
      </div>

      {/* Course Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full md:w-64 h-40 object-cover rounded-xl border border-slate-100 shadow-sm"
        />
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase">
              {course.code}
            </span>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
              {course.category}
            </span>
            {course.is_enrolled && (
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Enrolled</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          <p className="text-slate-600 text-sm leading-relaxed">{course.description}</p>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-500 border-t border-slate-100">
            <span>Instructor: <strong className="text-slate-800">{course.teacher_name}</strong></span>
            <span>Total Lessons: <strong className="text-slate-800">{course.materials.length}</strong></span>
            <span>Assessments: <strong className="text-slate-800">{course.quizzes.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Split: Left Sidebar Syllabus, Right Content Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Syllabus & Quizzes list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Course Curriculum</span>
            </h3>

            {course.materials.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No materials uploaded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {course.materials.map((m, idx) => {
                  const isSelected = selectedMaterial?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMaterial(m)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-start space-x-2.5 ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-sm'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="mt-0.5">{renderMaterialIcon(m.content_type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold">{m.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase capitalize">{m.content_type} • Lesson {idx + 1}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Course Quizzes List */}
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mt-6 mb-3 flex items-center space-x-2 border-t border-slate-100 pt-4">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Course Quizzes</span>
            </h3>

            {course.quizzes.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">No quizzes published yet.</p>
            ) : (
              <div className="space-y-2">
                {course.quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{quiz.title}</h4>
                        <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{quiz.time_limit_minutes} mins</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Award className="w-3 h-3 text-slate-400" />
                            <span>Pass: {quiz.passing_score}%</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenQuiz(quiz.id)}
                      disabled={!isAccessAllowed}
                      className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>{isAccessAllowed ? 'Attend Quiz' : 'Enroll to Take Quiz'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Material Reader */}
        <div className="lg:col-span-2">
          {!isAccessAllowed ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">Curriculum Content Locked</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
                Enroll in <strong>{course.title}</strong> to access full lectures, downloadable notes, and quiz assessments.
              </p>
              <button
                onClick={handleEnroll}
                disabled={enrollLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
              >
                Enroll Now to Unlock
              </button>
            </div>
          ) : selectedMaterial ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Material Title & Meta */}
              <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  {renderMaterialIcon(selectedMaterial.content_type)}
                  <h2 className="text-lg font-bold text-slate-900">{selectedMaterial.title}</h2>
                </div>
                <span className="text-xs uppercase font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {selectedMaterial.content_type}
                </span>
              </div>

              {/* Material Content View */}
              <div className="min-h-[300px]">
                {selectedMaterial.content_type === 'video' ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative">
                      {selectedMaterial.content_data.includes('youtube.com') || selectedMaterial.content_data.includes('youtu.be') ? (
                        <iframe
                          src={selectedMaterial.content_data.replace('watch?v=', 'embed/')}
                          title={selectedMaterial.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="text-center p-6 text-white">
                          <Video className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                          <p className="text-sm font-medium">Video Resource</p>
                          <a
                            href={selectedMaterial.content_data}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold"
                          >
                            Open Video Stream in New Tab
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-slate-700 text-sm whitespace-pre-wrap leading-relaxed font-sans bg-slate-50/70 p-6 rounded-xl border border-slate-200">
                    {selectedMaterial.content_data}
                  </div>
                )}
              </div>

              {/* Progress Tracker (Student US-06) */}
              {user?.role === 'student' && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Completed reading this module? Mark your progress to update your profile.
                  </p>
                  <button
                    onClick={() => handleMarkProgress(100)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Lesson Complete</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Select a lesson from the curriculum list on the left to begin reading.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
