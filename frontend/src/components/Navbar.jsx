import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  FileText,
  Users,
  Shield,
  Layers,
  BarChart3,
  LogOut,
  LogIn,
  UserCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAuthModal }) {
  const { user, logout, quickLogin } = useAuth();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-rose-200">Admin</span>;
      case 'teacher':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">Teacher</span>;
      case 'student':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top Banner: Quick Role Switcher for Demo */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium text-slate-200">Demo Testing Quick-Switch:</span>
          <span className="hidden sm:inline text-slate-400">Switch persona instantly to test user stories:</span>
        </div>
        <div className="flex items-center space-x-1.5 mt-1 sm:mt-0">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.role}
              onClick={() => quickLogin(acc.role)}
              className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                user?.role === acc.role
                  ? 'bg-indigo-600 text-white font-bold ring-1 ring-white/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {acc.role.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & System Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('browse')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">ELES</span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded">v1.0</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">E-Learning Education System</p>
            </div>
          </div>

          {/* Navigation Links according to Authenticated Role */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Always Available / Student: Browse Courses */}
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Courses</span>
            </button>

            {/* Student Links */}
            {user?.role === 'student' && (
              <>
                <button
                  onClick={() => setActiveTab('my-courses')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'my-courses'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>My Enrolled Courses</span>
                </button>
                <button
                  onClick={() => setActiveTab('my-results')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'my-results'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Quiz Results</span>
                </button>
              </>
            )}

            {/* Teacher Links */}
            {user?.role === 'teacher' && (
              <>
                <button
                  onClick={() => setActiveTab('teacher-courses')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'teacher-courses'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Course Management</span>
                </button>
                <button
                  onClick={() => setActiveTab('teacher-submissions')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'teacher-submissions'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Student Results</span>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Reports</span>
                </button>
              </>
            )}

            {/* Admin Links */}
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('admin-users')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'admin-users'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Users</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-courses')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'admin-courses'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Manage Courses</span>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>System Reports</span>
                </button>
              </>
            )}
          </nav>

          {/* User Profile / Auth Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-sm font-semibold text-slate-800">{user.full_name}</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
