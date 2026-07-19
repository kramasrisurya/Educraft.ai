import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AuthContainer from './components/AuthContainer';
import Header from './components/Header';
import ControlDashboard from './components/ControlDashboard';
import CoreLearningViewer from './components/CoreLearningViewer';
import QuizFrame from './components/QuizFrame';
import { Course, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [activeQuiz, setActiveQuiz] = useState<{ chapterId: string; chapterTitle: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persistent user login session on boot
  useEffect(() => {
    const cachedUser = localStorage.getItem('educraft_user');
    const cachedToken = localStorage.getItem('educraft_token');
    const cachedCourseId = localStorage.getItem('educraft_selected_course');

    if (cachedUser && cachedToken) {
      setUser(JSON.parse(cachedUser));
      setToken(cachedToken);
      if (cachedCourseId) {
        setSelectedCourseId(cachedCourseId);
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch course list whenever the user changes or is refreshed
  useEffect(() => {
    if (user) {
      fetchUserCourses();
    }
  }, [user]);

  const fetchUserCourses = async () => {
    try {
      const res = await fetch(`/api/courses?userId=${user?.id}`);
      const data = await res.json();
      if (res.ok) {
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed to query user courses:', err);
    }
  };

  const handleLoginSuccess = (loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    localStorage.setItem('educraft_user', JSON.stringify(loggedInUser));
    localStorage.setItem('educraft_token', sessionToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setSelectedCourseId('');
    setActiveQuiz(null);
    localStorage.removeItem('educraft_user');
    localStorage.removeItem('educraft_token');
    localStorage.removeItem('educraft_selected_course');
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (courseId) {
      localStorage.setItem('educraft_selected_course', courseId);
    } else {
      localStorage.removeItem('educraft_selected_course');
    }
  };

  const handleNavigateFromSearch = (courseId: string) => {
    handleSelectCourse(courseId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-slate-400 font-mono uppercase tracking-wider">Loading Platform...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden antialiased text-slate-800">
      <AnimatePresence mode="wait">
        {!user ? (
          /* LAYOUT A: AUTHENTICATION CONTAINER GATEWAY */
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <AuthContainer onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        ) : (
          /* FULL CLASSROOM PLATFORM WORKSPACE CONTAINER */
          <motion.div
            key="app-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col w-full"
          >
            {/* Header / Navbar */}
            <Header
              user={user}
              onLogout={handleLogout}
              onNavigateToCourse={handleNavigateFromSearch}
              coursesCount={courses.length}
            />

            {/* Main Application Area (Control Dashboard vs. Learning Viewer Classroom) */}
            <div className="flex-1 flex flex-col w-full">
              {!selectedCourseId ? (
                /* LAYOUT B: CONTROL DASHBOARD PANELS */
                <ControlDashboard
                  user={user}
                  courses={courses}
                  onCourseSelect={handleSelectCourse}
                  onRefreshCourses={fetchUserCourses}
                />
              ) : (
                /* LAYOUT C: CORE LEARNING VIEWER WORKSPACE */
                <CoreLearningViewer
                  courseId={selectedCourseId}
                  userId={user.id}
                  onBackToDashboard={() => handleSelectCourse('')}
                  onStartQuiz={(chapterId, chapterTitle) => setActiveQuiz({ chapterId, chapterTitle })}
                  onRefreshCourses={fetchUserCourses}
                />
              )}
            </div>

            {/* LAYOUT D: QUIZ OVERLAY FRAME */}
            <AnimatePresence>
              {activeQuiz && (
                <QuizFrame
                  chapterId={activeQuiz.chapterId}
                  chapterTitle={activeQuiz.chapterTitle}
                  userId={user.id}
                  onClose={() => setActiveQuiz(null)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
