import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  BookOpen,
  Users,
  FileText,
  HelpCircle,
  Check,
  PlusCircle,
  ExternalLink,
  Tag,
  ArrowRight
} from 'lucide-react';

export default function CourseCatalog({ onSelectCourse, onOpenAuthModal, onlyEnrolled = false }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      if (onlyEnrolled && user?.role === 'student') {
        const enrolledData = await api.getMyCourses();
        setCourses(enrolledData.map(item => ({
          ...item.course,
          progress_percent: item.progress_percent
        })));
      } else {
        const [courseList, catList] = await Promise.all([
          api.getCourses(searchQuery, selectedCategory),
          api.getCategories()
        ]);
        setCourses(courseList);
        setCategories(catList);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, onlyEnrolled, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleEnrollToggle = async (course) => {
    if (!user) {
      onOpenAuthModal('login');
      return;
    }
    if (user.role !== 'student') {
      alert('Only students can enroll in courses.');
      return;
    }

    setActionLoadingId(course.id);
    try {
      if (course.is_enrolled) {
        await api.unenrollCourse(course.id);
      } else {
        await api.enrollCourse(course.id);
      }
      await fetchCourses();
    } catch (err) {
      alert(err.message || 'Enrollment action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero & Search Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-sm border border-indigo-400/20 mb-3">
            <Tag className="w-3.5 h-3.5" />
            <span>{onlyEnrolled ? 'My Learning Space' : 'EPIC 2: Student Learning'}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {onlyEnrolled ? 'My Enrolled Courses' : 'Explore Courses & Certifications'}
          </h1>
          <p className="mt-2 text-indigo-100/80 text-sm leading-relaxed">
            {onlyEnrolled
              ? 'Continue your curriculum, review lessons, and test your knowledge through quizzes.'
              : 'Browse our catalog of verified computer science, AI, web development, and security courses.'}
          </p>

          {!onlyEnrolled && (
            <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center max-w-md gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Python, React, AI, Security..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-300 focus:placeholder:text-slate-400 text-sm rounded-xl border border-white/20 focus:outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Search
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Category Pills (Browse Mode) */}
      {!onlyEnrolled && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Course Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2" />
          <p className="text-sm">Loading course directory...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No courses found</h3>
          <p className="text-slate-500 text-sm mt-1">
            {onlyEnrolled
              ? "You haven't enrolled in any courses yet. Check the course catalog to start learning!"
              : 'Try adjusting your search criteria or category filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Thumbnail Header */}
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {course.code}
                </span>
                <span className="absolute top-3 right-3 bg-indigo-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow">
                  {course.category}
                </span>
              </div>

              {/* Course Info */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-medium text-indigo-700">Instructor: {course.teacher_name}</span>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course.enrolled_count} enrolled</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-slate-600 text-xs mt-2 line-clamp-3 leading-relaxed flex-1">
                  {course.description}
                </p>

                {/* Progress bar if enrolled */}
                {course.is_enrolled && course.progress_percent !== undefined && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Course Progress</span>
                      <span>{Math.round(course.progress_percent)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress_percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Details Pills */}
                <div className="flex items-center space-x-3 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.materials_count} Lessons</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.quizzes_count} Quizzes</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 flex items-center space-x-2">
                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>View Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {user?.role === 'student' && (
                    <button
                      onClick={() => handleEnrollToggle(course)}
                      disabled={actionLoadingId === course.id}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                        course.is_enrolled
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                    >
                      {course.is_enrolled ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Enrolled</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Enroll</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
