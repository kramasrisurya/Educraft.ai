import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileQuestion,
  HelpCircle,
  X,
  CheckCircle,
  XCircle,
  ChevronRight,
  RefreshCw,
  Award,
} from 'lucide-react';
import { Quiz } from '../types';

interface QuizFrameProps {
  chapterId: string;
  chapterTitle: string;
  userId: string;
  onClose: () => void;
}

export default function QuizFrame({
  chapterId,
  chapterTitle,
  userId,
  onClose,
}: QuizFrameProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [shortAnswer, setShortAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [answersMap, setAnswersMap] = useState<{ [quizId: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [gradeResult, setGradeResult] = useState<any | null>(null);
  const [showScoreCard, setShowScoreCard] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, [chapterId]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/quizzes/${chapterId}`);
      const data = await res.json();
      if (res.ok) {
        setQuizzes(data);
      }
    } catch (err) {
      console.error('Failed to load chapter quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (isAnswered) return;

    const currentQuiz = quizzes[currentIdx];
    const answerToStore = currentQuiz.question_type === 'SHORT' ? shortAnswer : selectedOption;

    setAnswersMap((prev) => ({
      ...prev,
      [currentQuiz.id]: answerToStore,
    }));
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < quizzes.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption('');
      setShortAnswer('');
      setIsAnswered(false);
    } else {
      // Reached final question, submit everything for database sync and grading
      submitFullQuiz();
    }
  };

  const submitFullQuiz = async () => {
    try {
      setIsLoading(true);
      
      // Compile full answers map
      const finalAnswers: { [id: string]: string } = {
        ...answersMap,
      };
      const currentQuiz = quizzes[currentIdx];
      const finalVal = currentQuiz.question_type === 'SHORT' ? shortAnswer : selectedOption;
      finalAnswers[currentQuiz.id] = finalVal;

      const res = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterId,
          answers: finalAnswers,
          userId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGradeResult(data);
        setShowScoreCard(true);
      }
    } catch (err) {
      console.error('Quiz submission failure:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption('');
    setShortAnswer('');
    setIsAnswered(false);
    setAnswersMap({});
    setGradeResult(null);
    setShowScoreCard(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-600 font-mono uppercase tracking-wider">Analyzing exam papers...</p>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-4 shadow-xl">
          <FileQuestion className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Quiz Unavailable</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            There are no test questions currently available for this chapter. Try re-uploading your PDF.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
          >
            Close Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentIdx];
  const totalQuestions = quizzes.length;

  return (
    <div id="quiz_frame_overlay" className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      
      {/* Quiz Window Wrapper */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Header bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex-1 min-w-0 pr-4">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
              {chapterTitle} Evaluation
            </span>
            <h2 className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5">Comprehensive Chapter Quiz</h2>
          </div>
          <button
            id="btn_quiz_close"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showScoreCard ? (
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-8 space-y-6"
            >
              {/* Question progress */}
              <div className="flex justify-between items-center text-xs font-mono text-slate-500 font-semibold">
                <span>QUESTION TYPE: <strong className="text-indigo-600 font-bold">{currentQuiz.question_type}</strong></span>
                <span>{currentIdx + 1} of {totalQuestions}</span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Question text */}
              <h3 className="text-base sm:text-lg font-bold text-slate-850 leading-snug">
                {currentQuiz.question}
              </h3>

              {/* Input forms depending on type */}
              <div className="space-y-2.5">
                {currentQuiz.question_type === 'SHORT' ? (
                  <div>
                    <textarea
                      id="quiz_short_input"
                      rows={3}
                      value={shortAnswer}
                      onChange={(e) => setShortAnswer(e.target.value)}
                      disabled={isAnswered}
                      placeholder="Type your summary explanation answer here..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 disabled:opacity-60 leading-relaxed"
                    />
                  </div>
                ) : (
                  currentQuiz.options.map((opt, oIdx) => {
                    const isSelected = selectedOption === opt;
                    const isCorrectOption = opt.trim().toLowerCase() === currentQuiz.correct_option.trim().toLowerCase();
                    
                    // Style states after being graded/answered
                    let rowClass = 'bg-slate-50/50 border-slate-200 hover:border-indigo-500/50 hover:bg-slate-50 text-slate-700';
                    if (isSelected && !isAnswered) {
                      rowClass = 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold';
                    } else if (isAnswered) {
                      if (isCorrectOption) {
                        rowClass = 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold';
                      } else if (isSelected && !isCorrectOption) {
                        rowClass = 'bg-rose-50 border-rose-500 text-rose-700 font-semibold';
                      } else {
                        rowClass = 'bg-slate-50/20 border-slate-200 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        id={`quiz_option_row_${oIdx}`}
                        onClick={() => handleOptionSelect(opt)}
                        disabled={isAnswered}
                        className={`w-full p-4 border rounded-xl text-left text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${rowClass}`}
                      >
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        <div className="shrink-0">
                          {isAnswered && isCorrectOption && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                          {isAnswered && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-rose-600" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Pedagogy explanation card expanded after answering */}
              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-600">
                      <HelpCircle className="w-4 h-4" />
                      Pedagogical Explanation
                    </div>
                    <p className="text-xs text-slate-650 leading-relaxed font-normal">
                      {currentQuiz.explanation}
                    </p>
                    {currentQuiz.question_type === 'SHORT' && (
                      <div className="mt-3 pt-2.5 border-t border-indigo-100/40 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Expected reference answer:</span>
                        <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">{currentQuiz.correct_option}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action controller footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                {!isAnswered ? (
                  <button
                    id="btn_quiz_submit_answer"
                    onClick={handleSubmitAnswer}
                    disabled={currentQuiz.question_type === 'SHORT' ? !shortAnswer.trim() : !selectedOption}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    id="btn_quiz_next_question"
                    onClick={handleNextQuestion}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {currentIdx + 1 === totalQuestions ? 'Finish Quiz' : 'Next Question'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* FINAL SCORECARD DISPLAY PANEL */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 sm:p-8 text-center space-y-6 bg-white"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 border border-indigo-150 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-800">Evaluation Finished!</h3>
                <p className="text-xs text-slate-400 font-semibold tracking-wider">
                  GRADE RECORDED FOR MAYUR ROCKSTARS
                </p>
              </div>

              {/* Scores dashboard */}
              <div className="max-w-xs mx-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-around items-center shadow-sm">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Attempt Score</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">
                    {gradeResult?.score} / {gradeResult?.total_questions}
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Success Rate</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {gradeResult?.percentage}%
                  </div>
                </div>
              </div>

              {/* Score evaluation reviews list */}
              <div className="text-left bg-slate-50/50 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 shadow-sm">
                <div className="p-3 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Question Summary Review
                </div>
                {gradeResult?.questions?.map((q: any, qIdx: number) => (
                  <div key={qIdx} className="p-4 bg-white flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">{q.question}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
                        <span>Your: <strong className="text-slate-500">{q.user_answer}</strong></span>
                        <span>•</span>
                        <span>Correct: <strong className="text-indigo-600">{q.correct_answer}</strong></span>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-bold font-mono ${q.is_correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {q.is_correct ? 'CORRECT' : 'INCORRECT'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action selectors */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  id="btn_quiz_retry"
                  onClick={handleResetQuiz}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Quiz
                </button>
                <button
                  id="btn_quiz_exit"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  Exit Review
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
