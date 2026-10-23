import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import CourseCatalog from './components/CourseCatalog';
import CourseViewer from './components/CourseViewer';
import QuizTakeModal from './components/QuizTakeModal';
import StudentResults from './components/StudentResults';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import ReportsDashboard from './components/ReportsDashboard';
import AuthModal from './components/AuthModal';

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [viewingCourseId, setViewingCourseId] = useState(null);
  const [activeQuizId, setActiveQuizId] = useState(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const handleOpenAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSelectCourse = (courseId) => {
    setViewingCourseId(courseId);
  };

  const handleBackToCatalog = () => {
    setViewingCourseId(null);
  };

  const handleOpenQuiz = (quizId) => {
    setActiveQuizId(quizId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar
        activeTab={viewingCourseId ? '' : activeTab}
        setActiveTab={(tab) => {
          setViewingCourseId(null);
          setActiveTab(tab);
        }}
        onOpenAuthModal={handleOpenAuthModal}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If viewing a single course in detail */}
        {viewingCourseId ? (
          <CourseViewer
            courseId={viewingCourseId}
            onBack={handleBackToCatalog}
            onOpenQuiz={handleOpenQuiz}
          />
        ) : (
          <>
            {/* Student & Public Views */}
            {activeTab === 'browse' && (
              <CourseCatalog
                onSelectCourse={handleSelectCourse}
                onOpenAuthModal={handleOpenAuthModal}
              />
            )}

            {activeTab === 'my-courses' && (
              <CourseCatalog
                onSelectCourse={handleSelectCourse}
                onOpenAuthModal={handleOpenAuthModal}
                onlyEnrolled={true}
              />
            )}

            {activeTab === 'my-results' && <StudentResults />}

            {/* Teacher Views */}
            {(activeTab === 'teacher-courses' || activeTab === 'teacher-submissions') && (
              <TeacherDashboard onSelectCourse={handleSelectCourse} />
            )}

            {/* Admin Views */}
            {(activeTab === 'admin-users' || activeTab === 'admin-courses') && (
              <AdminDashboard onSelectCourse={handleSelectCourse} />
            )}

            {/* Reports View */}
            {activeTab === 'reports' && <ReportsDashboard />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 E-Learning Education System (ELES). Built for all 5 Epics and 15 User Stories.</p>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">FastAPI • SQLite • React • Tailwind</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Quiz Modal */}
      <QuizTakeModal
        quizId={activeQuizId}
        isOpen={!!activeQuizId}
        onClose={() => setActiveQuizId(null)}
        onComplete={() => {
          // If viewing course, can stay or refresh
        }}
      />
    </div>
  );
}
