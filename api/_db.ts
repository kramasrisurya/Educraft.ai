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

const DB_FILE = process.env.VERCEL ? path.join('/tmp', 'database.json') : path.join(process.cwd(), 'database.json');

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
    if (!this.data.courses || this.data.courses.length === 0) {
      this.seedDefaultCourses();
    }
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

  public seedDefaultCourses() {
    // Seed Course 1: Deep Learning
    const course1Id = 'course-deep-learning';
    const course1: Course = {
      id: course1Id,
      user_id: 'default-user-id',
      title: 'Foundations of Deep Learning & Neural Networks',
      description: 'Master the mathematical mechanics of multi-layer perceptrons, backpropagation, activation functions, and gradient descent optimization.',
      estimated_time: '6 Hours',
      difficulty_level: 'Intermediate',
      learning_objectives: [
        'Derive the chain rule for backpropagation across matrix transformations',
        'Analyze loss landscapes, exploding gradients, and activation saturation',
        'Master adaptive optimizers (Adam, RMSProp, and SGD Momentum) from first principles'
      ],
      prerequisites: ['Linear Algebra', 'Multivariate Calculus', 'Basic Python'],
      created_at: new Date().toISOString(),
    };
    this.data.courses.push(course1);

    const c1Ch1: Chapter = {
      id: 'c1-ch1',
      course_id: course1Id,
      title: 'Mathematical Foundations & Forward Propagation',
      order_index: 1,
      is_completed: false,
    };
    const c1Ch2: Chapter = {
      id: 'c1-ch2',
      course_id: course1Id,
      title: 'Backpropagation & Optimization Dynamics',
      order_index: 2,
      is_completed: false,
    };
    this.data.chapters.push(c1Ch1, c1Ch2);

    const c1T1: Topic = { id: 'c1-t1', chapter_id: 'c1-ch1', title: 'Perceptrons & Layer Transformations', order_index: 1 };
    const c1T2: Topic = { id: 'c1-t2', chapter_id: 'c1-ch2', title: 'Automatic Differentiation & Loss Minimization', order_index: 1 };
    this.data.topics.push(c1T1, c1T2);

    const c1L1: Lesson = {
      id: 'c1-l1',
      topic_id: 'c1-t1',
      title: 'Linear Models & Affine Transformations',
      explanations: [
        'An artificial neural network computes compositions of affine transformations paired with non-linear activation functions. The basic perceptron maps an input vector x in R^n to an output scalar through a weighted sum: z = W^T * x + b, where W represents the synaptic weights and b denotes the bias offset.',
        'Without non-linear activations, stacking multiple linear layers collapses algebraically into a single linear transformation: W2 * (W1 * x + b1) + b2 = (W2 * W1) * x + (W2 * b1 + b2). Thus, non-linearities such as ReLU, GELU, and Sigmoid are required to enable universal function approximation across non-linear decision boundaries.'
      ],
      key_takeaways: [
        'Stacking linear layers without activations provides no additional representational power beyond a single linear regression model.',
        'Biases allow the activation hyperplane to shift away from the coordinate origin for flexible boundary fitting.',
        'Matrix operations leverage hardware tensor cores for massive parallel execution.'
      ],
      important_notes: [
        'Always verify tensor dimensions: if input is [batch_size, d_in] and weight is [d_in, d_out], the resultant projection is [batch_size, d_out].'
      ],
      real_world_examples: [
        'Embedding projections in modern LLMs (such as GPT-4 and LLaMA) project discrete vocabulary tokens into dense 4096-dimensional latent semantic spaces using affine layers.'
      ],
      summary: 'Forward propagation chains matrix multiplications with activation thresholds to produce predictive outputs.',
      order_index: 1,
    };

    const c1L2: Lesson = {
      id: 'c1-l2',
      topic_id: 'c1-t1',
      title: 'Activation Functions & Non-Linearities',
      explanations: [
        'Activation functions introduce non-linearity into neural networks, deciding whether a neuron should fire. Common functions include Sigmoid, Tanh, ReLU (Rectified Linear Unit), and GELU (Gaussian Error Linear Unit).',
        'ReLU solves the vanishing gradient problem encountered in deep networks with Sigmoid activations, as its derivative is 1 for all positive inputs, ensuring strong gradient flow during backpropagation.'
      ],
      key_takeaways: [
        'ReLU: f(x) = max(0, x), computationally efficient and prevents vanishing gradients for positive activations.',
        'Leaky ReLU and GELU address the dying ReLU problem where neurons get stuck at negative values with zero gradient.'
      ],
      important_notes: [
        'GELU is currently the standard activation function in modern transformer architectures like BERT and GPT.'
      ],
      real_world_examples: [
        'Computer vision convolutional models heavily utilize ReLU and Swish activations for high-speed feature map extraction.'
      ],
      summary: 'Activation functions grant networks the capability to approximate complex non-linear functions.',
      order_index: 2,
    };

    const c1L3: Lesson = {
      id: 'c1-l3',
      topic_id: 'c1-t2',
      title: 'Computational Graphs & Reverse-Mode AutoDiff',
      explanations: [
        'Backpropagation is reverse-mode automatic differentiation applied to a directed acyclic graph (DAG) of scalar loss evaluations. By storing intermediate activation states during the forward pass, gradients flow backward from the scalar objective loss to each learnable parameter via the multivariate chain rule.',
        'Adaptive learning rate optimizers like Adam combine exponentially decaying averages of past gradients (first moment / momentum) and past squared gradients (second moment / uncentered variance) to dynamically scale parameter updates.'
      ],
      key_takeaways: [
        'Reverse-mode autodiff scales linearly with the number of outputs, making it ideal for scalar loss functions with millions of parameters.',
        'Momentum dampens oscillations in steep canyon directions while accelerating along flat plateaus.'
      ],
      important_notes: [
        'Storing intermediate activations for the backward pass constitutes the primary memory overhead (VRAM consumption) during training.'
      ],
      real_world_examples: [
        'PyTorch autograd and TensorFlow GradientTape build runtime computational graphs during forward passes to compute loss.backward() in milliseconds.'
      ],
      summary: 'Reverse-mode automatic differentiation computes exact gradients across billions of parameters efficiently by caching intermediate forward activations.',
      order_index: 1,
    };

    this.data.lessons.push(c1L1, c1L2, c1L3);

    // Seed Chapter 1 Quizzes
    this.data.quizzes.push(
      {
        id: 'q1-1',
        chapter_id: 'c1-ch1',
        question: 'Why are non-linear activation functions strictly required in multi-layer deep networks?',
        options: [
          'To prevent stacked layers from collapsing into a single linear transformation',
          'To reduce GPU power consumption',
          'To force all gradients to zero',
          'To eliminate the need for bias parameters'
        ],
        correct_option: 'To prevent stacked layers from collapsing into a single linear transformation',
        explanation: 'Without non-linear activations, composing multiple linear matrices W2(W1x) algebraically simplifies to a single combined matrix (W2W1)x.',
        question_type: 'MCQ',
      },
      {
        id: 'q1-2',
        chapter_id: 'c1-ch1',
        question: 'True or False: The derivative of standard ReLU for positive inputs is 1.',
        options: ['True', 'False'],
        correct_option: 'True',
        explanation: 'For x > 0, d/dx(x) = 1, which keeps gradient signals from diminishing during backpropagation.',
        question_type: 'TF',
      },
      {
        id: 'q1-3',
        chapter_id: 'c1-ch1',
        question: 'Which activation function is widely standard in modern Transformer architectures like GPT and BERT?',
        options: ['GELU', 'Step Function', 'Binary Sigmoid', 'Identity'],
        correct_option: 'GELU',
        explanation: 'GELU (Gaussian Error Linear Unit) provides smooth, probabilistic non-linear activation preferred by Transformers.',
        question_type: 'MCQ',
      }
    );

    // Seed Chapter 2 Quizzes
    this.data.quizzes.push(
      {
        id: 'q2-1',
        chapter_id: 'c1-ch2',
        question: 'How does the Adam optimizer dynamically adapt learning rates for individual parameters?',
        options: [
          'By tracking exponentially decaying averages of past gradients and past squared gradients',
          'By randomly altering weights at each epoch',
          'By increasing learning rates whenever loss rises',
          'By disabling gradients on odd-numbered layers'
        ],
        correct_option: 'By tracking exponentially decaying averages of past gradients and past squared gradients',
        explanation: 'Adam computes bias-corrected first and second moment estimates to scale parameter step sizes individually.',
        question_type: 'MCQ',
      },
      {
        id: 'q2-2',
        chapter_id: 'c1-ch2',
        question: 'True or False: Storing forward activations in memory is required for computing backward gradients.',
        options: ['True', 'False'],
        correct_option: 'True',
        explanation: 'Backpropagation requires intermediate activations calculated during forward pass to compute layer gradients.',
        question_type: 'TF',
      }
    );

    // Seed Course 2: Distributed Systems
    const course2Id = 'course-distributed-systems';
    const course2: Course = {
      id: course2Id,
      user_id: 'default-user-id',
      title: 'Cloud Architecture & Distributed Systems',
      description: 'Master distributed consensus, CAP theorem trade-offs, horizontal scaling, partition tolerance, and resilient event-driven architectures.',
      estimated_time: '8 Hours',
      difficulty_level: 'Advanced',
      learning_objectives: [
        'Analyze consistency, availability, and partition tolerance trade-offs under the CAP theorem',
        'Design distributed consensus mechanisms using Raft leader election',
        'Implement resilient asynchronous messaging with idempotency and dead-letter queues'
      ],
      prerequisites: ['Networking fundamentals (TCP/IP, HTTP)', 'Basic concurrency'],
      created_at: new Date().toISOString(),
    };
    this.data.courses.push(course2);

    const c2Ch1: Chapter = {
      id: 'c2-ch1',
      course_id: course2Id,
      title: 'Distributed Consistency & Consensus Protocols',
      order_index: 1,
      is_completed: false,
    };
    this.data.chapters.push(c2Ch1);

    const c2T1: Topic = { id: 'c2-t1', chapter_id: 'c2-ch1', title: 'CAP Theorem & Eventual Consistency', order_index: 1 };
    this.data.topics.push(c2T1);

    const c2L1: Lesson = {
      id: 'c2-l1',
      topic_id: 'c2-t1',
      title: 'The CAP Theorem & PACELC Trade-offs',
      explanations: [
        'Eric Brewers CAP theorem states that any distributed data store can simultaneously provide at most two of three guarantees: Consistency (every read receives the most recent write or an error), Availability (every non-failing node returns a non-error response), and Partition Tolerance (the system continues to operate despite arbitrary network message loss).',
        'The PACELC theorem expands CAP: If there is a Partition (P), how does your system trade Consistency (C) vs Availability (A); Else (E), how does it trade Latency (L) vs Consistency (C)? In real-world distributed databases like DynamoDB and Cassandra, eventual consistency is chosen to minimize read/write latency.'
      ],
      key_takeaways: [
        'Network partitions are inevitable in physical distributed infrastructure, so Partition Tolerance is non-negotiable.',
        'CP systems (like etcd, ZooKeeper) favor strong consistency at the cost of returning errors during network isolation.',
        'AP systems (like Dynamo, Cassandra) favor high availability at the cost of transient stale reads.'
      ],
      important_notes: [
        'Consistency in CAP refers to Linearizability (single-copy consistency), distinct from the C in ACID transactions.'
      ],
      real_world_examples: [
        'Kubernetes uses etcd (a CP distributed key-value store powered by the Raft consensus protocol) to guarantee strict consistency for cluster state.'
      ],
      summary: 'Architecting distributed systems requires deliberate trade-offs between consistency, latency, and fault-tolerant availability.',
      order_index: 1,
    };
    this.data.lessons.push(c2L1);

    this.data.quizzes.push(
      {
        id: 'q3-1',
        chapter_id: 'c2-ch1',
        question: 'Under the CAP theorem, why can a distributed system not achieve both pure Consistency and Availability during a network partition?',
        options: [
          'Nodes on isolated partitions cannot communicate to agree on the latest state without stalling or serving stale data',
          'CPU registers overheat during network splits',
          'Data packets are permanently encrypted',
          'Distributed databases cannot use TCP/IP'
        ],
        correct_option: 'Nodes on isolated partitions cannot communicate to agree on the latest state without stalling or serving stale data',
        explanation: 'If nodes are partitioned, they must choose between continuing to serve requests without synchronization (sacrificing consistency) or rejecting requests (sacrificing availability).',
        question_type: 'MCQ',
      },
      {
        id: 'q3-2',
        chapter_id: 'c2-ch1',
        question: 'True or False: In the PACELC theorem, systems that are not currently partitioned must still make a trade-off between latency and consistency.',
        options: ['True', 'False'],
        correct_option: 'True',
        explanation: 'Even in normal operating conditions without partitions, synchronizing data across replicas introduces network latency.',
        question_type: 'TF',
      }
    );

    this.save();
  }

  // Synthesizes a structured course when user uploads a file or document
  public synthesizeCourse(rawTitle: string, userId: string): Course {
    const cleanTitle = rawTitle
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    const newCourse = this.createCourse({
      user_id: userId,
      title: formattedTitle,
      description: `Comprehensive interactive curriculum generated from ${cleanTitle}. Includes structured modules, key insights, and assessments.`,
      estimated_time: '4 Hours',
      difficulty_level: 'Intermediate',
      learning_objectives: [
        `Understand the core architectural principles of ${formattedTitle}`,
        `Master foundational methodologies, workflows, and key terminology`,
        `Apply theoretical frameworks to practical real-world challenges`
      ],
      prerequisites: ['Basic introductory knowledge', 'Curiosity and problem-solving mindset'],
    });

    // Chapter 1
    const ch1 = this.createChapter({
      course_id: newCourse.id,
      title: `Core Principles & Foundations of ${formattedTitle}`,
      order_index: 1,
      is_completed: false,
    });

    const t1 = this.createTopic({
      chapter_id: ch1.id,
      title: 'Foundational Concepts & Terminology',
      order_index: 1,
    });

    this.createLesson({
      topic_id: t1.id,
      title: `Introduction to ${formattedTitle}`,
      explanations: [
        `This instructional unit introduces the foundational theory, taxonomy, and operational rules governing ${formattedTitle}. Understanding these primitives establishes the basis for advanced practical mastery.`,
        `Modern workflows demand systematic separation of concerns, repeatable protocols, and measurable quality benchmarks across each stage of implementation.`
      ],
      key_takeaways: [
        `Master the foundational definitions and core mechanics of ${formattedTitle}.`,
        'Structure workflows sequentially to minimize compounding errors.',
        'Continuous verification and feedback loops ensure sustained reliability.'
      ],
      important_notes: [
        'Always evaluate edge-case scenarios before finalizing system configurations.'
      ],
      real_world_examples: [
        `Industry leaders apply these exact foundational practices to scale ${formattedTitle} reliably in production environments.`
      ],
      summary: `A rigorous grounding in ${formattedTitle} concepts and workflows.`,
      order_index: 1,
    });

    this.createLesson({
      topic_id: t1.id,
      title: 'Architectural Mechanisms & Workflows',
      explanations: [
        `Delving deeper into mechanical execution, this lesson analyzes how individual components interface under varying operational loads and conditions.`,
        `By decoupling complex pipelines into distinct modular boundaries, systems achieve both high cohesion and low coupling.`
      ],
      key_takeaways: [
        'Modularity enables parallel development and isolated debugging.',
        'Explicit contract interfaces prevent unintended side effects.'
      ],
      important_notes: [
        'Maintain strict input sanitization and boundary validations at all interface points.'
      ],
      real_world_examples: [
        'Enterprise microservices and modular pipelines implement these separation patterns.'
      ],
      summary: 'Key structural guidelines for building scalable, resilient implementations.',
      order_index: 2,
    });

    // Chapter 1 Quizzes
    this.createQuiz({
      chapter_id: ch1.id,
      question: `What is the primary objective of understanding ${formattedTitle} primitives?`,
      options: [
        'To establish a solid foundation for advanced implementation and troubleshooting',
        'To bypass all testing procedures',
        'To increase complexity unnecessarily',
        'To eliminate the need for documentation'
      ],
      correct_option: 'To establish a solid foundation for advanced implementation and troubleshooting',
      explanation: 'Grasping fundamental concepts ensures dependable decision-making when building complex architectures.',
      question_type: 'MCQ',
    });

    this.createQuiz({
      chapter_id: ch1.id,
      question: 'True or False: Decoupling complex systems into modular components improves both reliability and testability.',
      options: ['True', 'False'],
      correct_option: 'True',
      explanation: 'Modularity confines failures to isolated units and simplifies automated testing.',
      question_type: 'TF',
    });

    // Chapter 2
    const ch2 = this.createChapter({
      course_id: newCourse.id,
      title: `Applied Strategies & Best Practices`,
      order_index: 2,
      is_completed: false,
    });

    const t2 = this.createTopic({
      chapter_id: ch2.id,
      title: 'Production Implementation & Optimization',
      order_index: 1,
    });

    this.createLesson({
      topic_id: t2.id,
      title: 'Performance Tuning & Reliability',
      explanations: [
        `Transitioning from conceptual design to high-throughput production requires systematic performance profiling and observability metrics.`,
        `By monitoring latency percentiles, error budgets, and resource utilization, practitioners ensure dependable operation under stress.`
      ],
      key_takeaways: [
        'Measure before optimizing: profile bottlenecks using empirical telemetry data.',
        'Implement automated health probes and graceful degradation fallbacks.'
      ],
      important_notes: [
        'Premature optimization often introduces fragile complexity without meaningful gains.'
      ],
      real_world_examples: [
        'High-scale web platforms utilize distributed telemetry to detect anomalies in real time.'
      ],
      summary: 'Practical approaches to hardening performance and operational reliability.',
      order_index: 1,
    });

    this.createQuiz({
      chapter_id: ch2.id,
      question: 'Which metric strategy is most effective before applying performance optimizations?',
      options: [
        'Empirical profiling and telemetry measurement to identify true bottlenecks',
        'Guessing which function is slowest',
        'Rewriting the entire codebase from scratch',
        'Disabling all logging and metrics'
      ],
      correct_option: 'Empirical profiling and telemetry measurement to identify true bottlenecks',
      explanation: 'Data-driven profiling ensures optimization efforts focus on high-impact bottlenecks.',
      question_type: 'MCQ',
    });

    return newCourse;
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
    const userCourses = this.data.courses.filter(c => c.user_id === userId || c.user_id === 'default-user-id' || c.user_id === 'starter');
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
    const userCourses = this.data.courses.filter(c => c.user_id === userId || c.user_id === 'default-user-id' || c.user_id === 'starter');
    const courseIds = userCourses.map(c => c.id);

    const results: Array<{
      type: 'course' | 'chapter' | 'topic' | 'lesson';
      courseId: string;
      courseTitle: string;
      title: string;
      snippet: string;
      id: string;
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
      const course = userCourses.find(c => c.id === ch.course_id);
      if (course && ch.title.toLowerCase().includes(normalizedQuery)) {
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
      const chapter = chapters.find(ch => ch.id === t.chapter_id);
      const course = chapter ? userCourses.find(c => c.id === chapter.course_id) : null;
      if (chapter && course && t.title.toLowerCase().includes(normalizedQuery)) {
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
      const topic = topics.find(t => t.id === l.topic_id);
      const chapter = topic ? chapters.find(ch => ch.id === topic.chapter_id) : null;
      const course = chapter ? userCourses.find(c => c.id === chapter.course_id) : null;

      if (!chapter || !course) return;

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

  // Simple RAG retrieval chunk lookup across the course text segments
  public retrieveCourseContext(courseId: string, query: string, limit = 4): string {
    const chapters = this.getChapters(courseId);
    const chapterIds = chapters.map(ch => ch.id);
    const topics = this.data.topics.filter(t => chapterIds.includes(t.chapter_id));
    const topicIds = topics.map(t => t.id);
    const lessons = this.data.lessons.filter(l => topicIds.includes(l.topic_id));

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) {
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
          score += 1;
        }
      });

      return { lesson, score };
    });

    const topChunks = scoredChunks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

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
