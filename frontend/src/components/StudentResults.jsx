import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  BarChart2
} from 'lucide-react';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await api.getMyResults();
      setResults(data);
    } catch (err) {
      console.error('Failed to load student results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const totalAttempts = results.length;
  const passedAttempts = results.filter((r) => r.is_passed).length;
  const avgPercentage =
    totalAttempts > 0
      ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / totalAttempts)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Quiz Results & Academic History</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review all your completed assessments, scores, passing status, and detailed question breakdowns.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Total Attempts</p>
            <h3 className="text-2xl font-black text-slate-900">{totalAttempts}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Passed Quizzes</p>
            <h3 className="text-2xl font-black text-emerald-600">{passedAttempts}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Average Score</p>
            <h3 className="text-2xl font-black text-violet-600">{avgPercentage}%</h3>
          </div>
        </div>
      </div>

      {/* Results Table / Card List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2" />
          <p className="text-xs text-slate-500">Loading attempt records...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Assessment History Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            You haven't submitted any quizzes yet. Visit your enrolled courses and take a quiz to see results here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((sub) => {
            const isExpanded = expandedId === sub.id;
            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                {/* Result Summary Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${
                      sub.is_passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {sub.is_passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{sub.quiz_title}</h4>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(sub.submitted_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 justify-end">
                        <span className="text-sm font-black text-slate-800">
                          {sub.score} / {sub.total_points}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          sub.is_passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {sub.percentage}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {sub.is_passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>

                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && sub.answers && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Question Review
                    </h5>
                    {Object.entries(sub.answers).map(([qId, ans], idx) => (
                      <div
                        key={qId}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 bg-white ${
                          ans.is_correct ? 'border-emerald-200' : 'border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-slate-800">
                            Q{idx + 1}: {ans.question_text}
                          </p>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            ans.is_correct ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {ans.is_correct ? `+${ans.points_earned} pts` : '0 pts'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {ans.options?.map((opt, oIdx) => {
                            const isCorrect = ans.correct_option === oIdx;
                            const isSelected = ans.selected_option === oIdx;
                            return (
                              <div
                                key={oIdx}
                                className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-between ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                    : isSelected
                                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                                    : 'border-slate-100 text-slate-500'
                                }`}
                              >
                                <span>{opt}</span>
                                {isCorrect && <span className="text-[9px] uppercase font-bold text-emerald-600">Correct</span>}
                                {isSelected && !isCorrect && <span className="text-[9px] uppercase font-bold text-rose-600">Your Pick</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
