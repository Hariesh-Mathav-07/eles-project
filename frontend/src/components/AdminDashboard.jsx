import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  UserPlus,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  BookOpen,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard({ onSelectCourse }) {
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'courses'
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal: Create User as Admin
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('student');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, coursesData] = await Promise.all([
        api.getAdminUsers(roleFilter, searchQuery),
        api.getAdminCourses()
      ]);
      setUsers(usersData);
      setCourses(coursesData);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  // US-13: Toggle User Active Status
  const handleToggleStatus = async (user) => {
    try {
      await api.updateUserStatus(user.id, !user.is_active);
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  // US-13: Change User Role
  const handleChangeRole = async (user, nextRole) => {
    try {
      await api.updateUserRole(user.id, nextRole);
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'Role change failed');
    }
  };

  // US-13: Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? All their enrollments and submissions will be deleted.')) return;
    try {
      await api.deleteUser(userId);
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'Delete user failed');
    }
  };

  // US-13: Create User Submit
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminUser({
        email: newEmail,
        password: newPassword,
        full_name: newName,
        role: newRole
      });
      setIsCreateUserModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'User creation failed');
    }
  };

  // US-14: Toggle Course Publish / Moderation
  const handleToggleCoursePublish = async (courseId) => {
    try {
      await api.toggleCoursePublish(courseId);
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'Toggle course publish failed');
    }
  };

  // US-14: Delete Course
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course and all its materials and quizzes?')) return;
    try {
      await api.adminDeleteCourse(courseId);
      await fetchAdminData();
    } catch (err) {
      alert(err.message || 'Course deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administrator Command Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            System administration for users, permissions, curriculum moderation, and platform security.
          </p>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={() => setIsCreateUserModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${
            activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${
            activeTab === 'courses' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Course Moderation ({courses.length})</span>
        </button>
      </div>

      {/* Tab 1: Manage Students & Teachers (US-13) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Role Filter:</span>
              {['All', 'student', 'teacher', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Search
              </button>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className="text-xs p-1 rounded border border-slate-200 bg-white font-semibold"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{u.is_active ? 'Active' : 'Deactivated'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {u.id !== currentAdmin?.id && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                                u.is_active
                                  ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Courses (US-14) */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">System Course Moderation (US-14)</h3>
              <p className="text-xs text-slate-500">Publish, unpublish, inspect syllabus materials, or remove course offerings.</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {courses.length} Total Courses
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Enrollments</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{c.title}</td>
                    <td className="py-3 px-4">{c.teacher_name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">{c.enrolled_count}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.is_published ? 'Published' : 'Unpublished'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectCourse(c.id)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleToggleCoursePublish(c.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                          c.is_published
                            ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {c.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create User as Admin */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Provision User Account (US-13)</h3>
            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Richard Feynman"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="rfeynman@eles.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
