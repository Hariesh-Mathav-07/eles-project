import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export default function QuizTakeModal({ quizId, isOpen, onClose, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  useEffect(() => {
    if (!isOpen || !quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setSubmissionResult(null);
      setAnswers({});
      setCurrentQuestionIdx(0);
      try {
        const data = await api.getQuiz(quizId);
        setQuiz(data);
        setTimeLeftSeconds((data.time_limit_minutes || 10) * 60);
      } catch (err) {
        alert(err.message || 'Failed to load quiz');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, isOpen]);

  // Countdown timer
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0 || submissionResult) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds, submissionResult]);

  if (!isOpen) return null;

  const handleSelectOption = (questionId, optionIdx) => {
    if (submissionResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    if (submitting || submissionResult) return;
    setSubmitting(true);
    try {
      const result = await api.submitQuiz(quizId, answers);
      setSubmissionResult(result);
      if (onComplete) onComplete();
    } catch (err) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide">
              {quiz?.title || 'Interactive Assessment'}
            </h3>
          </div>

          <div className="flex items-center space-x-4">
            {!submissionResult && timeLeftSeconds !== null && (
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                timeLeftSeconds < 120 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-amber-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2" />
              <p className="text-xs text-slate-500">Preparing assessment questions...</p>
            </div>
          ) : submissionResult ? (
            /* US-08: Instant Results & Answer Breakdown */
            <div className="space-y-6">
              {/* Scorecard Hero */}
              <div className={`p-6 rounded-2xl text-center border ${
                submissionResult.is_passed
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="inline-flex p-3 rounded-full mb-3 shadow-inner bg-white">
                  {submissionResult.is_passed ? (
                    <Award className="w-10 h-10 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-10 h-10 text-rose-600" />
                  )}
                </div>
                <h4 className="text-xl font-black">
                  {submissionResult.is_passed ? 'Congratulations! You Passed!' : 'Assessment Incomplete'}
                </h4>
                <p className="text-xs mt-1 text-slate-600">
                  {submissionResult.is_passed
                    ? 'You met the required passing threshold for this course.'
                    : 'You did not reach the minimum passing grade. Review your answers below and try again.'}
                </p>

                <div className="mt-4 inline-flex items-center space-x-6 px-6 py-2.5 bg-white rounded-xl shadow-sm border border-slate-200/60">
                  <div>
                    <span className="block text-2xl font-black text-slate-900">{submissionResult.score} / {submissionResult.total_points}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Points</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className={`block text-2xl font-black ${submissionResult.is_passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {submissionResult.percentage}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Score Percentage</span>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">Detailed Answer Review</h5>
                {Object.entries(submissionResult.answers).map(([qId, ans], index) => (
                  <div
                    key={qId}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      ans.is_correct ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-900">Question {index + 1}: {ans.question_text}</span>
                      {ans.is_correct ? (
                        <span className="flex items-center space-x-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>+{ans.points_earned} pts</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-rose-700 font-bold">
                          <XCircle className="w-4 h-4" />
                          <span>0 pts</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 pl-2 pt-1">
                      {ans.options.map((opt, optIdx) => {
                        const isStudentChoice = ans.selected_option === optIdx;
                        const isCorrectOption = ans.correct_option === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg font-medium flex items-center justify-between ${
                              isCorrectOption
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                                : isStudentChoice
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'text-slate-600'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrectOption && <span className="text-[10px] uppercase text-emerald-700">Correct Answer</span>}
                            {isStudentChoice && !isCorrectOption && <span className="text-[10px] uppercase text-rose-700">Your Selection</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* US-07: Taking Quiz Interface */
            <div className="space-y-6">
              {/* Question Navigation Dots */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Question {currentQuestionIdx + 1} of {quiz.questions.length}
                </span>
                <div className="flex space-x-1.5">
                  {quiz.questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all ${
                        currentQuestionIdx === idx
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                          : answers[q.id] !== undefined
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Question Box */}
              {quiz.questions[currentQuestionIdx] && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {quiz.questions[currentQuestionIdx].question_text}
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Worth {quiz.questions[currentQuestionIdx].points} points
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {quiz.questions[currentQuestionIdx].options.map((optionText, optIdx) => {
                      const qId = quiz.questions[currentQuestionIdx].id;
                      const isSelected = answers[qId] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(qId, optIdx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center space-x-3 ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm ring-1 ring-indigo-400'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-500'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {submissionResult ? (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Done Reviewing
              </button>
            </div>
          ) : (
            <>
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold rounded-lg transition-colors"
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {currentQuestionIdx < quiz?.questions?.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    <span>{submitting ? 'Evaluating...' : 'Submit Assessment'}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
