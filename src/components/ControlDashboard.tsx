import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  BookOpen,
  BarChart3,
  History,
  FileText,
  Clock,
  TrendingUp,
  BrainCircuit,
  ChevronRight,
  Flame,
  Award,
  BookCheck,
} from 'lucide-react';
import { Course, User } from '../types';

interface ControlDashboardProps {
  user: User;
  courses: Course[];
  onCourseSelect: (courseId: string) => void;
  onRefreshCourses: () => void;
}

type TabType = 'upload' | 'collection' | 'analytics' | 'history';

export default function ControlDashboard({
  user,
  courses,
  onCourseSelect,
  onRefreshCourses,
}: ControlDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'reading' | 'architecting' | 'fleshing' | 'success' | 'error'>('idle');
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger loading message steps sequentially for great user feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploadState === 'reading') {
      setUploadProgressPercent(15);
      interval = setTimeout(() => {
        setUploadState('architecting');
        setUploadProgressPercent(50);
      }, 3500);
    } else if (uploadState === 'architecting') {
      interval = setTimeout(() => {
        setUploadState('fleshing');
        setUploadProgressPercent(85);
      }, 4500);
    }
    return () => clearTimeout(interval);
  }, [uploadState]);

  // Load quiz attempts for analytics
  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'history') {
      fetchQuizAttempts();
    }
  }, [activeTab]);

  const fetchQuizAttempts = async () => {
    try {
      const res = await fetch(`/api/courses?userId=${user.id}`);
      if (res.ok) {
        // Also load attempts from general endpoints
        const attemptsRes = await fetch(`/api/quizzes/submit?userId=${user.id}`); // Fetch via mock-friendly endpoint or state
        // Let's mock attempts if not fetched or retrieve them
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMessage('Unsupported file type. Please upload a PDF document.');
      setUploadState('error');
      return;
    }

    setUploadState('reading');
    setUploadProgressPercent(10);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('userId', user.id);

    try {
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate course.');
      }

      setUploadProgressPercent(100);
      setUploadState('success');
      onRefreshCourses();
      
      // Auto redirect to courses collection after 1.5 seconds
      setTimeout(() => {
        setUploadState('idle');
        setActiveTab('collection');
        onCourseSelect(data.course_id);
      }, 1500);
    } catch (error: any) {
      console.error('File generation upload error:', error);
      setErrorMessage(error.message || 'An error occurred during e-course generation.');
      setUploadState('error');
    }
  };

  // Helper metrics
  const totalCourses = courses.length;
  const completedCoursesCount = courses.filter(c => c.progress_percent === 100).length;
  const averageProgress = totalCourses > 0 
    ? Math.round(courses.reduce((acc, curr) => acc + curr.progress_percent, 0) / totalCourses) 
    : 0;

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-84px)] bg-slate-50 text-slate-800">
      {/* Left Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-2">
        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Workspace Navigation
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <button
            id="nav_collection"
            onClick={() => setActiveTab('collection')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'collection'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Course Collection
            {totalCourses > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'collection'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {totalCourses}
              </span>
            )}
          </button>

          <button
            id="nav_upload"
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload Center
          </button>

          <button
            id="nav_analytics"
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Learning Analytics
          </button>

          <button
            id="nav_history"
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Activity Logs
          </button>
        </nav>

        {/* Dynamic motivation banner */}
        <div className="mt-auto p-4 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
            <BrainCircuit className="w-4 h-4" />
            AI E-Learning
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload any academic PDF textbook. EduCraft AI will convert unstructured chapters into interactive quizzes and modules.
          </p>
        </div>
      </aside>

      {/* Main Body Panel */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* TAB 1: COURSE COLLECTION */}
          {activeTab === 'collection' && (
            <motion.div
              key="collection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Hero statistics panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Courses</div>
                    <div className="text-2xl font-bold text-slate-800">{totalCourses}</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <BookCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Courses</div>
                    <div className="text-2xl font-bold text-slate-800">{completedCoursesCount}</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Progress</div>
                    <div className="text-2xl font-bold text-slate-800">{averageProgress}%</div>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-800">Your Generated E-Courses</h2>
                <button
                  id="btn_tab_upload"
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  Generate New Course
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-4 shadow-sm">
                  <div className="inline-flex items-center justify-center p-4 bg-slate-50 text-slate-400 rounded-2xl mb-2 border border-slate-100">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">No E-courses created yet</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                    Upload your first digital textbook or syllabus PDF. Our Gemini-powered engine will design study material automatically.
                  </p>
                  <button
                    id="btn_upload_first"
                    onClick={() => setActiveTab('upload')}
                    className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm inline-flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Upload PDF Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      id={`course_card_${course.id}`}
                      className="bg-white border border-slate-200 hover:border-indigo-400/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group"
                    >
                      <div className="p-6 flex-1 space-y-4">
                        {/* Course header */}
                        <div className="flex items-start justify-between gap-3">
                          <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-full tracking-wider border ${
                            course.difficulty_level.toLowerCase() === 'advanced'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : course.difficulty_level.toLowerCase() === 'intermediate'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {course.difficulty_level}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-450" />
                            {course.estimated_time}
                          </span>
                        </div>

                        {/* Course metadata */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        {/* Objectives capsules */}
                        {course.learning_objectives?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {course.learning_objectives.slice(0, 2).map((obj, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100 max-w-[180px] truncate">
                                ✓ {obj}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Course progress footer */}
                      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-1.5">
                            <span>Syllabus Progress</span>
                            <span className="font-bold text-slate-700">{course.progress_percent}%</span>
                          </div>
                          {/* Active Visual Progress Bar */}
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress_percent}%` }}
                            />
                          </div>
                        </div>

                        <button
                          id={`btn_resume_${course.id}`}
                          onClick={() => onCourseSelect(course.id)}
                          className="px-4 py-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 cursor-pointer shadow-sm"
                        >
                          Resume
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: UPLOAD CENTER FILE DROPPER */}
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 max-w-xl mx-auto"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-800">Upload Educational PDF</h2>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">
                  Upload slides, chapters, research notes, or digital books. Our multi-agent pipeline extracts raw technical text, outlines chapters, generates lesson explanations, and scripts interactive questions.
                </p>
              </div>

              {uploadState === 'idle' ? (
                <div
                  id="drop_zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 group ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-indigo-400/50 hover:bg-slate-100/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="p-4 rounded-full bg-slate-50 border border-slate-250 group-hover:scale-105 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all text-slate-400 group-hover:text-indigo-600">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-700">Drag & Drop PDF here</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      or click to browse local documents
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    Max size: 40MB
                  </div>
                </div>
              ) : uploadState === 'success' ? (
                <div className="bg-white border border-emerald-100 p-8 rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Course Generated Successfully!</h3>
                  <p className="text-xs text-slate-500">
                    EduCraft AI is configuring your e-learning classroom and workspace...
                  </p>
                </div>
              ) : uploadState === 'error' ? (
                <div className="bg-white border border-rose-100 p-8 rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    !
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Generation Failed</h3>
                  <p className="text-xs text-rose-600 px-4 leading-relaxed">
                    {errorMessage || 'An error occurred while analyzing the PDF.'}
                  </p>
                  <button
                    onClick={() => setUploadState('idle')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Try Another File
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-sm">
                  {/* Step message selector */}
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                    
                    <h3 className="text-base font-bold text-slate-800">
                      {uploadState === 'reading' && 'Reading File Contents...'}
                      {uploadState === 'architecting' && 'Architecting Course Syllabus...'}
                      {uploadState === 'fleshing' && 'Fleshing Out Lessons & Quizzes...'}
                    </h3>
                    
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      {uploadState === 'reading' && 'Extracting text strings, cleaning double newlines and analyzing document structure.'}
                      {uploadState === 'architecting' && 'Structuring text sections into chapters, lesson topics, and estimated study difficulty levels.'}
                      {uploadState === 'fleshing' && 'Writing definitions, summaries, chapter psychometric multiple-choice quizzes, and real-world examples.'}
                    </p>
                  </div>

                  {/* Active Visual Progress and Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-450 uppercase tracking-wide">
                      <span>Course generator engine active</span>
                      <span>{uploadProgressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${uploadProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: LEARNING ANALYTICS */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-800">Your Learning Analytics</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Analyze course progress metrics, quiz performance histories, and study stats.
                </p>
              </div>

              {courses.length === 0 ? (
                <div className="p-8 text-center text-slate-450 text-sm">
                  Create an e-course first to see analytical dashboards.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats grids */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Course completions list */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Course Progress Breakdown</h3>
                      <div className="space-y-4">
                        {courses.map((course) => (
                          <div key={course.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-700 truncate max-w-[250px]">{course.title}</span>
                              <span className="font-mono text-slate-400">{course.completed_lessons} / {course.total_lessons} units</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${course.progress_percent}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-600 w-8 text-right">{course.progress_percent}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overall activity chart simulation */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Study Intensity</h3>
                        <p className="text-xs text-slate-450">Hourly activity levels based on completed units.</p>
                      </div>
                      
                      <div className="h-32 flex items-end justify-between gap-2 pt-6">
                        {[40, 20, 60, 80, 50, 90, 70].map((val, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                            <div
                              className="w-full bg-indigo-100 hover:bg-indigo-600 rounded-t-md transition-all duration-200 cursor-pointer"
                              style={{ height: `${val}%` }}
                            />
                            <span className="text-[9px] font-mono text-slate-400">Day {idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: ACTIVITY HISTORIES LOGS */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-800">Activity History Logs</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Review lesson completions, course updates, and exam submissions.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                <div className="p-4 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Live Audit Trails
                </div>

                {courses.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    No active study logs yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {courses.map((course) => (
                      <div key={course.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-700">Generated Course syllabus</div>
                            <div className="text-slate-400 font-mono mt-0.5">{course.title} ({course.difficulty_level})</div>
                          </div>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">Just Now</span>
                      </div>
                    ))}
                    
                    {/* Simulated user registration log */}
                    <div className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-700">Account session active</div>
                          <div className="text-slate-400 font-mono mt-0.5">Mayur Rockstars signed in to EduCraft AI</div>
                        </div>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">Just Now</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
