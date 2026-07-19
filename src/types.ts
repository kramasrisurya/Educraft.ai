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
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
}

export interface Lesson {
  id: string;
  topic_id: string;
  title: string;
  explanations: string[];
  key_takeaways: string[];
  important_notes: string[];
  real_world_examples: string[];
  summary: string;
  order_index: number;
  is_completed?: boolean;
}

export interface Topic {
  id: string;
  chapter_id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  is_completed: boolean;
  topics: Topic[];
}

export interface Quiz {
  id: string;
  chapter_id: string;
  question: string;
  options: string[];
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

export interface SearchResult {
  type: 'course' | 'chapter' | 'topic' | 'lesson';
  courseId: string;
  courseTitle: string;
  title: string;
  snippet: string;
  id: string;
}
