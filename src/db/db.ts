import fs from 'fs';
import path from 'path';

// Define the database schemas using TypeScript interfaces matching the PostgreSQL requirements
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string;
  estimated_time: string;
  difficulty_level: string;
  learning_objectives: string[];
  prerequisites: string[];
  created_at: string;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  is_completed: boolean; // Computed or custom completed state
}

export interface Topic {
  id: string;
  chapter_id: string;
  title: string;
  order_index: number;
}

export interface Lesson {
  id: string;
  topic_id: string;
  title: string;
  explanations: string[]; // Array of paragraphs
  key_takeaways: string[];
  important_notes: string[];
  real_world_examples: string[];
  summary: string;
  order_index: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface Quiz {
  id: string;
  chapter_id: string;
  question: string;
  options: string[]; // Empty if SHORT
  correct_option: string;
  explanation: string;
  question_type: 'MCQ' | 'TF' | 'SHORT';
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  chapter_id: string;
  score: number;
  total_questions: number;
  attempted_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  course_id: string;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  courses: Course[];
  chapters: Chapter[];
  topics: Topic[];
  lessons: Lesson[];
  user_progress: UserProgress[];
  quizzes: Quiz[];
  quiz_attempts: QuizAttempt[];
  chat_history: ChatMessage[];
}

const DB_FILE = path.join(process.cwd(), 'database.json');

class DatabaseEngine {
  private data: DatabaseSchema = {
    users: [],
    courses: [],
    chapters: [],
    topics: [],
    lessons: [],
    user_progress: [],
    quizzes: [],
    quiz_attempts: [],
    chat_history: [],
  };

  constructor() {
    this.load();
    this.seedMockUser();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (error) {
      console.error('Failed to load database file, resetting to empty schema:', error);
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save database file:', error);
    }
  }

  private seedMockUser() {
    // Standard default user
    const defaultUserId = 'default-user-id';
    const existing = this.data.users.find(u => u.id === defaultUserId);
    if (!existing) {
      this.data.users.push({
        id: defaultUserId,
        email: 'mayurirockstars@gmail.com',
        full_name: 'Mayur Rockstars',
        created_at: new Date().toISOString(),
      });
      this.save();
    }
  }

  // General CRUD helper operations
  public generateUUID(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(email: string, fullName: string): User {
    const existing = this.getUserByEmail(email);
    if (existing) return existing;

    const newUser: User = {
      id: this.generateUUID(),
      email,
      full_name: fullName,
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // Courses
  public getCourses(userId: string) {
    const userCourses = this.data.courses.filter(c => c.user_id === userId);
    return userCourses.map(course => {
      // Compute metrics: progress percentage = (completed_lessons / total_lessons) * 100
      const chapters = this.data.chapters.filter(ch => ch.course_id === course.id);
      const chapterIds = chapters.map(ch => ch.id);
      const topics = this.data.topics.filter(t => chapterIds.includes(t.chapter_id));
      const topicIds = topics.map(t => t.id);
      const lessons = this.data.lessons.filter(l => topicIds.includes(l.topic_id));
      const totalLessons = lessons.length;

      const completedLessons = lessons.filter(l => {
        return this.data.user_progress.some(p => p.user_id === userId && p.lesson_id === l.id && p.is_completed);
      }).length;

      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        ...course,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percent: progressPercent,
      };
    });
  }

  public getCourse(courseId: string): Course | undefined {
    return this.data.courses.find(c => c.id === courseId);
  }

  public createCourse(course: Omit<Course, 'id' | 'created_at'>): Course {
    const newCourse: Course = {
      ...course,
      id: this.generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.data.courses.push(newCourse);
    this.save();
    return newCourse;
  }

  // Chapters, Topics, Lessons
  public createChapter(chapter: Omit<Chapter, 'id'>): Chapter {
    const newChapter: Chapter = {
      ...chapter,
      id: this.generateUUID(),
    };
    this.data.chapters.push(newChapter);
    this.save();
    return newChapter;
  }

  public getChapters(courseId: string): Chapter[] {
    return this.data.chapters.filter(c => c.course_id === courseId).sort((a, b) => a.order_index - b.order_index);
  }

  public createTopic(topic: Omit<Topic, 'id'>): Topic {
    const newTopic: Topic = {
      ...topic,
      id: this.generateUUID(),
    };
    this.data.topics.push(newTopic);
    this.save();
    return newTopic;
  }

  public getTopics(chapterId: string): Topic[] {
    return this.data.topics.filter(t => t.chapter_id === chapterId).sort((a, b) => a.order_index - b.order_index);
  }

  public createLesson(lesson: Omit<Lesson, 'id'>): Lesson {
    const newLesson: Lesson = {
      ...lesson,
      id: this.generateUUID(),
    };
    this.data.lessons.push(newLesson);
    this.save();
    return newLesson;
  }

  public getLessons(topicId: string): Lesson[] {
    return this.data.lessons.filter(l => l.topic_id === topicId).sort((a, b) => a.order_index - b.order_index);
  }

  // Full Course Hierarchy
  public getCourseHierarchy(courseId: string, userId: string) {
    const course = this.getCourse(courseId);
    if (!course) return null;

    const chapters = this.getChapters(courseId);
    const enrichedChapters = chapters.map(ch => {
      const topics = this.getTopics(ch.id);
      const enrichedTopics = topics.map(top => {
        const lessons = this.getLessons(top.id);
        const enrichedLessons = lessons.map(les => {
          const progress = this.data.user_progress.find(
            p => p.user_id === userId && p.lesson_id === les.id
          );
          return {
            ...les,
            is_completed: progress ? progress.is_completed : false,
          };
        });
        return {
          ...top,
          lessons: enrichedLessons,
        };
      });

      // Calculate chapter completion based on its lessons
      const chapterLessons = enrichedTopics.flatMap(t => t.lessons);
      const totalChapterLessons = chapterLessons.length;
      const completedChapterLessons = chapterLessons.filter(l => l.is_completed).length;
      const chapterCompleted = totalChapterLessons > 0 && totalChapterLessons === completedChapterLessons;

      return {
        ...ch,
        is_completed: chapterCompleted,
        topics: enrichedTopics,
      };
    });

    return {
      course,
      chapters: enrichedChapters,
    };
  }

  // Progress Tracking
  public toggleLessonProgress(userId: string, lessonId: string, isCompleted: boolean): { lesson_id: string; is_completed: boolean } {
    let progress = this.data.user_progress.find(p => p.user_id === userId && p.lesson_id === lessonId);
    if (progress) {
      progress.is_completed = isCompleted;
      progress.completed_at = isCompleted ? new Date().toISOString() : null;
    } else {
      progress = {
        id: this.generateUUID(),
        user_id: userId,
        lesson_id: lessonId,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      };
      this.data.user_progress.push(progress);
    }
    this.save();
    return { lesson_id: lessonId, is_completed: isCompleted };
  }

  // Quizzes
  public createQuiz(quiz: Omit<Quiz, 'id'>): Quiz {
    const newQuiz: Quiz = {
      ...quiz,
      id: this.generateUUID(),
    };
    this.data.quizzes.push(newQuiz);
    this.save();
    return newQuiz;
  }

  public getQuizzesByChapter(chapterId: string): Quiz[] {
    return this.data.quizzes.filter(q => q.chapter_id === chapterId);
  }

  // Quiz attempts
  public createQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'attempted_at'>): QuizAttempt {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: this.generateUUID(),
      attempted_at: new Date().toISOString(),
    };
    this.data.quiz_attempts.push(newAttempt);
    this.save();
    return newAttempt;
  }

  public getQuizAttempts(userId: string, chapterId?: string): QuizAttempt[] {
    return this.data.quiz_attempts.filter(a => {
      const matchUser = a.user_id === userId;
      const matchChapter = chapterId ? a.chapter_id === chapterId : true;
      return matchUser && matchChapter;
    }).sort((a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime());
  }

  // Chat History
  public getChatHistory(userId: string, courseId: string): ChatMessage[] {
    return this.data.chat_history
      .filter(chat => chat.user_id === userId && chat.course_id === courseId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public addChatMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): ChatMessage {
    const newMessage: ChatMessage = {
      ...message,
      id: this.generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.data.chat_history.push(newMessage);
    this.save();
    return newMessage;
  }

  // Global search across course modules
  public globalSearch(userId: string, query: string) {
    if (!query || query.trim() === '') return [];
    const normalizedQuery = query.toLowerCase().trim();

    // Find all courses for this user
    const userCourses = this.data.courses.filter(c => c.user_id === userId);
    const courseIds = userCourses.map(c => c.id);

    const results: Array<{
      type: 'course' | 'chapter' | 'topic' | 'lesson';
      courseId: string;
      courseTitle: string;
      title: string;
      snippet: string;
      id: string; // ID of the specific target
    }> = [];

    userCourses.forEach(c => {
      if (c.title.toLowerCase().includes(normalizedQuery) || c.description.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: 'course',
          courseId: c.id,
          courseTitle: c.title,
          title: c.title,
          snippet: c.description.substring(0, 120) + (c.description.length > 120 ? '...' : ''),
          id: c.id,
        });
      }
    });

    const chapters = this.data.chapters.filter(ch => courseIds.includes(ch.course_id));
    chapters.forEach(ch => {
      const course = userCourses.find(c => c.id === ch.course_id)!;
      if (ch.title.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: 'chapter',
          courseId: ch.course_id,
          courseTitle: course.title,
          title: ch.title,
          snippet: `Chapter in ${course.title}`,
          id: ch.id,
        });
      }
    });

    const chapterIds = chapters.map(ch => ch.id);
    const topics = this.data.topics.filter(t => chapterIds.includes(t.chapter_id));
    topics.forEach(t => {
      const chapter = chapters.find(ch => ch.id === t.chapter_id)!;
      const course = userCourses.find(c => c.id === chapter.course_id)!;
      if (t.title.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: 'topic',
          courseId: chapter.course_id,
          courseTitle: course.title,
          title: t.title,
          snippet: `Topic in chapter: ${chapter.title}`,
          id: t.id,
        });
      }
    });

    const topicIds = topics.map(t => t.id);
    const lessons = this.data.lessons.filter(l => topicIds.includes(l.topic_id));
    lessons.forEach(l => {
      const topic = topics.find(t => t.id === l.topic_id)!;
      const chapter = chapters.find(ch => ch.id === topic.chapter_id)!;
      const course = userCourses.find(c => c.id === chapter.course_id)!;

      const explanationsMatch = l.explanations.some(p => p.toLowerCase().includes(normalizedQuery));
      const takeawaysMatch = l.key_takeaways.some(p => p.toLowerCase().includes(normalizedQuery));
      const examplesMatch = l.real_world_examples.some(p => p.toLowerCase().includes(normalizedQuery));
      const summaryMatch = l.summary.toLowerCase().includes(normalizedQuery);

      if (l.title.toLowerCase().includes(normalizedQuery) || explanationsMatch || takeawaysMatch || examplesMatch || summaryMatch) {
        let snippet = '';
        if (l.title.toLowerCase().includes(normalizedQuery)) {
          snippet = l.summary ? l.summary.substring(0, 120) + '...' : 'Lesson module';
        } else if (explanationsMatch) {
          const matchParagraph = l.explanations.find(p => p.toLowerCase().includes(normalizedQuery)) || '';
          snippet = '... ' + matchParagraph.substring(Math.max(0, matchParagraph.toLowerCase().indexOf(normalizedQuery) - 40), Math.min(matchParagraph.length, matchParagraph.toLowerCase().indexOf(normalizedQuery) + 80)) + ' ...';
        } else {
          snippet = l.summary ? l.summary.substring(0, 120) + '...' : 'Lesson module content';
        }

        results.push({
          type: 'lesson',
          courseId: chapter.course_id,
          courseTitle: course.title,
          title: l.title,
          snippet: snippet,
          id: l.id,
        });
      }
    });

    return results;
  }

  // Simple RAG retrieval chunk lookup across the course's text segments
  public retrieveCourseContext(courseId: string, query: string, limit = 4): string {
    const chapters = this.getChapters(courseId);
    const chapterIds = chapters.map(ch => ch.id);
    const topics = this.data.topics.filter(t => chapterIds.includes(t.chapter_id));
    const topicIds = topics.map(t => t.id);
    const lessons = this.data.lessons.filter(l => topicIds.includes(l.topic_id));

    // Simple keyword/TF-IDF style relevance scoring for each lesson chunk
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) {
      // Fallback: return the first few lessons' key explanations
      return lessons.slice(0, 2).map(l => {
        return `[Lesson: ${l.title}]\nExplanations: ${l.explanations.join('\n')}\nTakeaways: ${l.key_takeaways.join(', ')}`;
      }).join('\n\n');
    }

    const scoredChunks = lessons.map(lesson => {
      let score = 0;
      const lessonText = [
        lesson.title,
        ...lesson.explanations,
        ...lesson.key_takeaways,
        ...lesson.important_notes,
        ...lesson.real_world_examples,
        lesson.summary,
      ].join(' ').toLowerCase();

      queryWords.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'g');
        const matches = lessonText.match(regex);
        if (matches) {
          score += matches.length * 2;
        } else if (lessonText.includes(word)) {
          score += 1; // Partial match
        }
      });

      return { lesson, score };
    });

    // Sort by score descending and return the top matching text chunks
    const topChunks = scoredChunks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // If no match found, fallback to first 2 lessons
    const selected = topChunks.length > 0 ? topChunks.map(c => c.lesson) : lessons.slice(0, 2);

    return selected.map(l => {
      return `### LESSON: ${l.title}
Explanations:
${l.explanations.join('\n')}

Key Takeaways:
${l.key_takeaways.map(t => `- ${t}`).join('\n')}

Important Notes:
${l.important_notes.map(n => `* ${n}`).join('\n')}

Real-World Implementation:
${l.real_world_examples.join('\n')}

Summary: ${l.summary}`;
    }).join('\n\n---\n\n');
  }
}

export const db = new DatabaseEngine();
