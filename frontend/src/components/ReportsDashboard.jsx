import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  BarChart3,
  Download,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Layers,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';

export default function ReportsDashboard() {
  const [overview, setOverview] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [statsData, enrollData, quizData] = await Promise.all([
          api.getOverviewStats(),
          api.getEnrollmentReports(),
          api.getQuizPerformanceReports()
        ]);
        setOverview(statsData);
        setEnrollments(enrollData);
        setQuizzes(quizData);
      } catch (err) {
        console.error('Reports fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // US-15: Export Comprehensive CSV Report
  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      const blob = await api.exportCsvReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ELES_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Export CSV failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics, Results & Reports (EPIC 5)</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Institutional performance reporting, enrollment statistics, quiz pass rates, and CSV data export.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={downloading}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center space-x-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{downloading ? 'Generating CSV...' : 'Export Complete CSV Report (US-15)'}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2" />
          <p className="text-xs text-slate-500">Compiling statistical reports...</p>
        </div>
      ) : (
        <>
          {/* Section 1: KPI Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Students</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overview?.total_students}</p>
              <div className="mt-2 text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>Active Learners</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Instructors</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overview?.total_teachers}</p>
              <div className="mt-2 text-[10px] text-amber-600 font-semibold flex items-center space-x-1">
                <GraduationCap className="w-3 h-3" />
                <span>Faculty Members</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Courses</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overview?.total_courses}</p>
              <div className="mt-2 text-[10px] text-indigo-600 font-semibold flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>Total Catalog</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Enrollments</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overview?.total_enrollments}</p>
              <div className="mt-2 text-[10px] text-violet-600 font-semibold flex items-center space-x-1">
                <Layers className="w-3 h-3" />
                <span>Course Admissions</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Submissions</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{overview?.total_quiz_submissions}</p>
              <div className="mt-2 text-[10px] text-blue-600 font-semibold flex items-center space-x-1">
                <Award className="w-3 h-3" />
                <span>Quizzes Taken</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pass Rate</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{overview?.average_pass_rate}%</p>
              <div className="mt-2 text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Overall Benchmark</span>
              </div>
            </div>
          </div>

          {/* Section 2: Split Tables for Enrollment Distribution & Quiz Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 1: Course Enrollment Counts */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Course Enrollment Breakdown</h3>
                <span className="text-[10px] uppercase font-bold text-slate-400">By Curriculum</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Course Title</th>
                      <th className="py-2.5 px-4">Instructor</th>
                      <th className="py-2.5 px-4 text-right">Enrolled Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((enr) => (
                      <tr key={enr.course_id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{enr.course_code}</td>
                        <td className="py-2.5 px-4 font-medium">{enr.course_title}</td>
                        <td className="py-2.5 px-4 text-slate-500">{enr.teacher_name}</td>
                        <td className="py-2.5 px-4 text-right font-black text-indigo-600">{enr.enrolled_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Quiz Evaluation Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Quiz Assessment & Pass Rates</h3>
                <span className="text-[10px] uppercase font-bold text-slate-400">Evaluations</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Quiz Title</th>
                      <th className="py-2.5 px-4">Attempts</th>
                      <th className="py-2.5 px-4">Pass / Fail</th>
                      <th className="py-2.5 px-4 text-right">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quizzes.map((q) => (
                      <tr key={q.quiz_id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900">{q.quiz_title}</div>
                          <div className="text-[10px] text-slate-400">{q.course_title}</div>
                        </td>
                        <td className="py-2.5 px-4 font-semibold">{q.total_attempts}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-emerald-700 font-bold">{q.pass_count}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-rose-700 font-bold">{q.fail_count}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-slate-800">
                          {q.average_percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
