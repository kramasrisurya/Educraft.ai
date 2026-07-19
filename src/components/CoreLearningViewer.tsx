import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  BookOpen,
  MessageSquare,
  Sparkles,
  HelpCircle,
  Lightbulb,
  FileQuestion,
  ChevronLeft,
  BookMarked,
  ArrowRight,
  Send,
} from 'lucide-react';
import { Chapter, Course, Lesson, Topic, ChatMessage } from '../types';

interface CoreLearningViewerProps {
  courseId: string;
  userId: string;
  onBackToDashboard: () => void;
  onStartQuiz: (chapterId: string, chapterTitle: string) => void;
  onRefreshCourses: () => void;
}

export default function CoreLearningViewer({
  courseId,
  userId,
  onBackToDashboard,
  onStartQuiz,
  onRefreshCourses,
}: CoreLearningViewerProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<{ [id: string]: boolean }>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load course details, structure hierarchy, and chat logs
  useEffect(() => {
    fetchCourseHierarchy();
    fetchChatHistory();
  }, [courseId]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const fetchCourseHierarchy = async (selectFirstLesson = true) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/courses/${courseId}?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setCourse(data.course);
        setChapters(data.chapters);

        // Auto-expand the first chapter and set active lesson if available
        if (data.chapters.length > 0) {
          const firstChapter = data.chapters[0];
          setExpandedChapters((prev) => ({ ...prev, [firstChapter.id]: true }));

          if (selectFirstLesson && firstChapter.topics.length > 0 && firstChapter.topics[0].lessons.length > 0) {
            setActiveLesson(firstChapter.topics[0].lessons[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`/api/chat/history?course_id=${courseId}&userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setChatMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch chat logs:', err);
    }
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleProgress = async (lessonId: string, isCompleted: boolean) => {
    try {
      const res = await fetch('/api/progress/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, is_completed: isCompleted, userId }),
      });

      if (res.ok) {
        // Refresh local completion status
        await fetchCourseHierarchy(false);
        onRefreshCourses();

        // Update active lesson completion state locally
        if (activeLesson && activeLesson.id === lessonId) {
          setActiveLesson((prev) => (prev ? { ...prev, is_completed: isCompleted } : null));
        }
      }
    } catch (err) {
      console.error('Progress toggle failure:', err);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    if (!customText) setChatInput('');

    // Append user bubble locally first for immediate fluidity
    const tempUserMsg: ChatMessage = {
      id: Math.random().toString(),
      user_id: userId,
      course_id: courseId,
      sender: 'user',
      message: textToSend,
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend, course_id: courseId, userId }),
      });
      const data = await res.json();

      if (res.ok) {
        // Overwrite temp / just pull full server synced logs
        fetchChatHistory();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Chat companion error:', err);
      const errMsg: ChatMessage = {
        id: Math.random().toString(),
        user_id: userId,
        course_id: courseId,
        sender: 'ai',
        message: 'Tutor companion is currently optimizing channels. Please check connection and retry.',
        created_at: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const triggerActionChip = (type: 'summary' | 'quiz' | 'terms') => {
    if (!activeLesson) return;
    let query = '';
    if (type === 'summary') {
      query = `💡 Can you summarize the key learning concepts for the active lesson unit: "${activeLesson.title}"?`;
    } else if (type === 'quiz') {
      query = `❓ Ask me a quick test question related to the key terms of "${activeLesson.title}" and evaluate my response.`;
    } else if (type === 'terms') {
      query = `📝 Explain the core industrial terms and edge cases found in "${activeLesson.title}".`;
    }
    handleSendMessage(query);
  };

  // Locate the next lesson in sequence
  const getNextLesson = (): { lesson: Lesson; chapterTitle: string; chapterId: string } | null => {
    if (!activeLesson || chapters.length === 0) return null;

    let foundCurrent = false;
    for (const ch of chapters) {
      for (const t of ch.topics) {
        for (const les of t.lessons) {
          if (foundCurrent) {
            return { lesson: les, chapterTitle: ch.title, chapterId: ch.id };
          }
          if (les.id === activeLesson.id) {
            foundCurrent = true;
          }
        }
      }
    }
    return null;
  };

  const handleNextLessonProgression = async () => {
    if (!activeLesson) return;

    // Toggle current completed if not checked yet
    if (!activeLesson.is_completed) {
      await handleToggleProgress(activeLesson.id, true);
    }

    const next = getNextLesson();
    if (next) {
      setActiveLesson(next.lesson);
      // Ensure chapter accordion is expanded
      setExpandedChapters((prev) => ({ ...prev, [next.chapterId]: true }));
    } else {
      // Reached end of entire course
      onBackToDashboard();
    }
  };

  const formatMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-2">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-slate-800 mt-5 mb-2.5">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-bold text-indigo-600 mt-6 mb-3">{line.replace('# ', '')}</h2>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="text-xs text-slate-650 ml-4 list-disc mb-1.5 leading-relaxed">
            {line.trim().substring(2)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      
      const parts = line.split('**');
      if (parts.length > 1) {
        return (
          <p key={idx} className="text-xs text-slate-650 leading-relaxed mb-2.5">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-slate-900">{part}</strong> : part)}
          </p>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-650 leading-relaxed mb-2.5">
          {line}
        </p>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-semibold text-slate-400 font-mono uppercase tracking-wider">Synchronizing Classroom...</h3>
      </div>
    );
  }

  const nextLessonData = getNextLesson();

  return (
    <div className="flex-1 flex flex-col xl:flex-row bg-slate-50 text-slate-800">
      
      {/* COLUMN A: LEFT CONTENT DIRECTORY TREE (1/4 width) */}
      <aside className="w-full xl:w-80 bg-white border-b xl:border-b-0 xl:border-r border-slate-200 flex flex-col">
        {/* Back navigation header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-800 transition-colors cursor-pointer font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </button>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Active Classroom</span>
        </div>

        {/* Directory trees */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-800 px-1 mb-2 line-clamp-1">{course?.title}</h2>
          
          {chapters.map((ch, chIdx) => (
            <div key={ch.id} className="border border-slate-200/65 bg-white rounded-xl overflow-hidden shadow-sm">
              {/* Collapsible Accordion Header */}
              <button
                id={`chapter_header_${ch.id}`}
                onClick={() => toggleChapter(ch.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider">
                    Chapter {chIdx + 1}
                  </div>
                  <h3 className="text-xs font-bold text-slate-700 line-clamp-1 mt-0.5">{ch.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {ch.is_completed && (
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  )}
                  {expandedChapters[ch.id] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Accordion List Body */}
              <AnimatePresence initial={false}>
                {expandedChapters[ch.id] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                  >
                    <div className="p-2.5 space-y-3">
                      {ch.topics.map((topic, tIdx) => (
                        <div key={topic.id} className="space-y-1">
                          <div className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {topic.title}
                          </div>

                          <div className="space-y-0.5">
                            {topic.lessons.map((les) => (
                              <div
                                key={les.id}
                                className={`w-full p-2 rounded-lg flex items-center justify-between transition-colors text-left group ${
                                  activeLesson?.id === les.id
                                    ? 'bg-indigo-50 text-indigo-750 border border-indigo-100'
                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/60 border border-transparent'
                                }`}
                              >
                                {/* Checkbox representing unit completed progress state */}
                                <button
                                  id={`check_lesson_${les.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleProgress(les.id, !les.is_completed);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                >
                                  {les.is_completed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                                  )}
                                </button>

                                <button
                                  id={`btn_lesson_${les.id}`}
                                  onClick={() => setActiveLesson(les)}
                                  className="flex-1 min-w-0 px-2 py-1 text-xs text-left cursor-pointer font-semibold"
                                >
                                  <span className="line-clamp-1">{les.title}</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Chapter Quiz Trigger Button */}
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          id={`btn_quiz_trigger_${ch.id}`}
                          onClick={() => onStartQuiz(ch.id, ch.title)}
                          className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 hover:border-transparent rounded-lg text-xs font-bold text-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileQuestion className="w-3.5 h-3.5" />
                          Take Chapter Quiz
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </aside>

      {/* COLUMN B: MAIN LESSON VIEW WORKSPACE AREA (2/4 width) */}
      <section className="flex-1 flex flex-col border-b xl:border-b-0 xl:border-r border-slate-200 bg-white">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {activeLesson ? (
              <motion.div
                key={activeLesson.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Lesson Header */}
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-mono">
                    <BookMarked className="w-4 h-4" />
                    <span>Unit {activeLesson.order_index} Module</span>
                  </div>
                  <h1 className="text-2xl font-sans font-bold tracking-tight text-slate-800">
                    {activeLesson.title}
                  </h1>
                </div>

                {/* explanations text body */}
                <div className="space-y-4">
                  {activeLesson.explanations?.map((p, pIdx) => (
                    <p key={pIdx} className="text-sm text-slate-600 leading-relaxed font-normal">
                      {p}
                    </p>
                  ))}
                </div>

                {/* important notes callout block */}
                {activeLesson.important_notes?.length > 0 && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-r-xl space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-850">
                      <Lightbulb className="w-4 h-4 text-amber-600 animate-pulse" />
                      Pedagogical Nuance
                    </div>
                    {activeLesson.important_notes.map((note, nIdx) => (
                      <p key={nIdx} className="text-xs text-slate-600 leading-relaxed">
                        {note}
                      </p>
                    ))}
                  </div>
                )}

                {/* key takeaways grid list loop */}
                {activeLesson.key_takeaways?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Takeaway Rules</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeLesson.key_takeaways.map((takeaway, tIdx) => (
                        <div key={tIdx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                            {tIdx + 1}
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed">{takeaway}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* real world implementation scenario panels */}
                {activeLesson.real_world_examples?.length > 0 && (
                  <div className="bg-indigo-50/50 border border-indigo-100/65 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                      Real-World Case Study
                    </h3>
                    <div className="space-y-2">
                      {activeLesson.real_world_examples.map((ex, exIdx) => (
                        <p key={exIdx} className="text-xs text-slate-600 leading-relaxed">
                          {ex}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* lesson summary text box */}
                {activeLesson.summary && (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Summary</h4>
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      "{activeLesson.summary}"
                    </p>
                  </div>
                )}

                {/* Bottom progression panel */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 text-center sm:text-left">
                    {activeLesson.is_completed ? (
                      <span className="text-emerald-600 font-semibold">✓ This instructional unit is completed</span>
                    ) : (
                      <span>Progressing this module will mark it completed automatically.</span>
                    )}
                  </div>

                  <button
                    id="btn_progress_next"
                    onClick={handleNextLessonProgression}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {nextLessonData ? (
                      <>
                        <span>Mark Unit Completed & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Mark Course Complete & Exit</span>
                        <CheckSquare className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                <BookOpen className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm">Please select a lesson topic inside the content directory.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* COLUMN C: SIDEBAR AI CONTEXT COMPANION CHATBOT (1/4 width) */}
      <aside className="w-full xl:w-80 bg-slate-50 border-b xl:border-b-0 xl:border-l border-slate-200 flex flex-col xl:h-[calc(100vh-84px)] sticky top-[84px]">
        {/* Companion Top bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">Tutor Companion</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Connected
          </span>
        </div>

        {/* Companion chat bubble outputs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[250px] max-h-[450px] xl:max-h-none">
          {chatMessages.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">Stuck on a complex term?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[180px] mx-auto">
                Ask your personal textbook assistant to summarize parameters, outline edge cases, or test your retention on lesson topics.
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed border ${
                    msg.sender === 'user'
                      ? 'chat-bubble-user bg-indigo-600 text-white border-indigo-500 rounded-tr-none shadow-sm'
                      : 'chat-bubble-ai bg-white text-slate-800 border-slate-200/80 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <div className="space-y-1 font-sans">{formatMarkdown(msg.message)}</div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  )}
                </div>
                <span className="text-[8px] text-slate-400 font-mono mt-1 px-1">
                  {msg.sender === 'user' ? 'Student' : 'AI Companion'}
                </span>
              </div>
            ))
          )}

          {isChatLoading && (
            <div className="flex items-start gap-2.5">
              <div className="bg-white text-slate-500 border border-slate-200 shadow-sm rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">AI tutor writing...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Floating action shortcuts */}
        <div className="p-3 border-t border-slate-200 bg-white shrink-0 space-y-2 shadow-sm">
          {activeLesson && (
            <div className="flex flex-wrap gap-1.5">
              <button
                id="btn_chip_summary"
                onClick={() => triggerActionChip('summary')}
                className="text-[10px] font-semibold px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Lightbulb className="w-3 h-3 text-amber-500" />
                💡 Summarize Lesson
              </button>
              <button
                id="btn_chip_quiz"
                onClick={() => triggerActionChip('quiz')}
                className="text-[10px] font-semibold px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <HelpCircle className="w-3 h-3 text-indigo-500" />
                ❓ Quick Quiz
              </button>
              <button
                id="btn_chip_terms"
                onClick={() => triggerActionChip('terms')}
                className="text-[10px] font-semibold px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <BookOpen className="w-3 h-3 text-emerald-500" />
                📝 Explain Key Terms
              </button>
            </div>
          )}

          {/* Chat text box input */}
          <div className="flex gap-2">
            <input
              id="tutor_chat_input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Ask a custom question..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
            />
            <button
              id="btn_tutor_send"
              onClick={() => handleSendMessage()}
              disabled={isChatLoading || !chatInput.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-50 disabled:text-slate-300 text-white rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

    </div>
  );
}
