var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_module = require("module");
var import_vite = require("vite");
var import_genai = require("@google/genai");

// src/db/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DB_FILE = process.env.VERCEL ? import_path.default.join("/tmp", "database.json") : import_path.default.join(process.cwd(), "database.json");
var DatabaseEngine = class {
  constructor() {
    this.data = {
      users: [],
      courses: [],
      chapters: [],
      topics: [],
      lessons: [],
      user_progress: [],
      quizzes: [],
      quiz_attempts: [],
      chat_history: []
    };
    this.load();
    this.seedMockUser();
    if (!this.data.courses || this.data.courses.length === 0) {
      this.seedDefaultCourses();
    }
  }
  load() {
    try {
      if (import_fs.default.existsSync(DB_FILE)) {
        const fileContent = import_fs.default.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (error) {
      console.error("Failed to load database file, resetting to empty schema:", error);
      this.save();
    }
  }
  save() {
    try {
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save database file:", error);
    }
  }
  seedMockUser() {
    const defaultUserId = "default-user-id";
    const existing = this.data.users.find((u) => u.id === defaultUserId);
    if (!existing) {
      this.data.users.push({
        id: defaultUserId,
        email: "mayurirockstars@gmail.com",
        full_name: "Mayur Rockstars",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.save();
    }
  }
  seedDefaultCourses() {
    const course1Id = "course-deep-learning";
    const course1 = {
      id: course1Id,
      user_id: "default-user-id",
      title: "Foundations of Deep Learning & Neural Networks",
      description: "Master the mathematical mechanics of multi-layer perceptrons, backpropagation, activation functions, and gradient descent optimization.",
      estimated_time: "6 Hours",
      difficulty_level: "Intermediate",
      learning_objectives: [
        "Derive the chain rule for backpropagation across matrix transformations",
        "Analyze loss landscapes, exploding gradients, and activation saturation",
        "Master adaptive optimizers (Adam, RMSProp, and SGD Momentum) from first principles"
      ],
      prerequisites: ["Linear Algebra", "Multivariate Calculus", "Basic Python"],
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.courses.push(course1);
    const c1Ch1 = {
      id: "c1-ch1",
      course_id: course1Id,
      title: "Mathematical Foundations & Forward Propagation",
      order_index: 1,
      is_completed: false
    };
    const c1Ch2 = {
      id: "c1-ch2",
      course_id: course1Id,
      title: "Backpropagation & Optimization Dynamics",
      order_index: 2,
      is_completed: false
    };
    this.data.chapters.push(c1Ch1, c1Ch2);
    const c1T1 = { id: "c1-t1", chapter_id: "c1-ch1", title: "Perceptrons & Layer Transformations", order_index: 1 };
    const c1T2 = { id: "c1-t2", chapter_id: "c1-ch2", title: "Automatic Differentiation & Loss Minimization", order_index: 1 };
    this.data.topics.push(c1T1, c1T2);
    const c1L1 = {
      id: "c1-l1",
      topic_id: "c1-t1",
      title: "Linear Models & Affine Transformations",
      explanations: [
        "An artificial neural network computes compositions of affine transformations paired with non-linear activation functions. The basic perceptron maps an input vector x in R^n to an output scalar through a weighted sum: z = W^T * x + b, where W represents the synaptic weights and b denotes the bias offset.",
        "Without non-linear activations, stacking multiple linear layers collapses algebraically into a single linear transformation: W2 * (W1 * x + b1) + b2 = (W2 * W1) * x + (W2 * b1 + b2). Thus, non-linearities such as ReLU, GELU, and Sigmoid are required to enable universal function approximation across non-linear decision boundaries."
      ],
      key_takeaways: [
        "Stacking linear layers without activations provides no additional representational power beyond a single linear regression model.",
        "Biases allow the activation hyperplane to shift away from the coordinate origin for flexible boundary fitting.",
        "Matrix operations leverage hardware tensor cores for massive parallel execution."
      ],
      important_notes: [
        "Always verify tensor dimensions: if input is [batch_size, d_in] and weight is [d_in, d_out], the resultant projection is [batch_size, d_out]."
      ],
      real_world_examples: [
        "Embedding projections in modern LLMs (such as GPT-4 and LLaMA) project discrete vocabulary tokens into dense 4096-dimensional latent semantic spaces using affine layers."
      ],
      summary: "Forward propagation chains matrix multiplications with activation thresholds to produce predictive outputs.",
      order_index: 1
    };
    const c1L2 = {
      id: "c1-l2",
      topic_id: "c1-t1",
      title: "Activation Functions & Non-Linearities",
      explanations: [
        "Activation functions introduce non-linearity into neural networks, deciding whether a neuron should fire. Common functions include Sigmoid, Tanh, ReLU (Rectified Linear Unit), and GELU (Gaussian Error Linear Unit).",
        "ReLU solves the vanishing gradient problem encountered in deep networks with Sigmoid activations, as its derivative is 1 for all positive inputs, ensuring strong gradient flow during backpropagation."
      ],
      key_takeaways: [
        "ReLU: f(x) = max(0, x), computationally efficient and prevents vanishing gradients for positive activations.",
        "Leaky ReLU and GELU address the dying ReLU problem where neurons get stuck at negative values with zero gradient."
      ],
      important_notes: [
        "GELU is currently the standard activation function in modern transformer architectures like BERT and GPT."
      ],
      real_world_examples: [
        "Computer vision convolutional models heavily utilize ReLU and Swish activations for high-speed feature map extraction."
      ],
      summary: "Activation functions grant networks the capability to approximate complex non-linear functions.",
      order_index: 2
    };
    const c1L3 = {
      id: "c1-l3",
      topic_id: "c1-t2",
      title: "Computational Graphs & Reverse-Mode AutoDiff",
      explanations: [
        "Backpropagation is reverse-mode automatic differentiation applied to a directed acyclic graph (DAG) of scalar loss evaluations. By storing intermediate activation states during the forward pass, gradients flow backward from the scalar objective loss to each learnable parameter via the multivariate chain rule.",
        "Adaptive learning rate optimizers like Adam combine exponentially decaying averages of past gradients (first moment / momentum) and past squared gradients (second moment / uncentered variance) to dynamically scale parameter updates."
      ],
      key_takeaways: [
        "Reverse-mode autodiff scales linearly with the number of outputs, making it ideal for scalar loss functions with millions of parameters.",
        "Momentum dampens oscillations in steep canyon directions while accelerating along flat plateaus."
      ],
      important_notes: [
        "Storing intermediate activations for the backward pass constitutes the primary memory overhead (VRAM consumption) during training."
      ],
      real_world_examples: [
        "PyTorch autograd and TensorFlow GradientTape build runtime computational graphs during forward passes to compute loss.backward() in milliseconds."
      ],
      summary: "Reverse-mode automatic differentiation computes exact gradients across billions of parameters efficiently by caching intermediate forward activations.",
      order_index: 1
    };
    this.data.lessons.push(c1L1, c1L2, c1L3);
    this.data.quizzes.push(
      {
        id: "q1-1",
        chapter_id: "c1-ch1",
        question: "Why are non-linear activation functions strictly required in multi-layer deep networks?",
        options: [
          "To prevent stacked layers from collapsing into a single linear transformation",
          "To reduce GPU power consumption",
          "To force all gradients to zero",
          "To eliminate the need for bias parameters"
        ],
        correct_option: "To prevent stacked layers from collapsing into a single linear transformation",
        explanation: "Without non-linear activations, composing multiple linear matrices W2(W1x) algebraically simplifies to a single combined matrix (W2W1)x.",
        question_type: "MCQ"
      },
      {
        id: "q1-2",
        chapter_id: "c1-ch1",
        question: "True or False: The derivative of standard ReLU for positive inputs is 1.",
        options: ["True", "False"],
        correct_option: "True",
        explanation: "For x > 0, d/dx(x) = 1, which keeps gradient signals from diminishing during backpropagation.",
        question_type: "TF"
      },
      {
        id: "q1-3",
        chapter_id: "c1-ch1",
        question: "Which activation function is widely standard in modern Transformer architectures like GPT and BERT?",
        options: ["GELU", "Step Function", "Binary Sigmoid", "Identity"],
        correct_option: "GELU",
        explanation: "GELU (Gaussian Error Linear Unit) provides smooth, probabilistic non-linear activation preferred by Transformers.",
        question_type: "MCQ"
      }
    );
    this.data.quizzes.push(
      {
        id: "q2-1",
        chapter_id: "c1-ch2",
        question: "How does the Adam optimizer dynamically adapt learning rates for individual parameters?",
        options: [
          "By tracking exponentially decaying averages of past gradients and past squared gradients",
          "By randomly altering weights at each epoch",
          "By increasing learning rates whenever loss rises",
          "By disabling gradients on odd-numbered layers"
        ],
        correct_option: "By tracking exponentially decaying averages of past gradients and past squared gradients",
        explanation: "Adam computes bias-corrected first and second moment estimates to scale parameter step sizes individually.",
        question_type: "MCQ"
      },
      {
        id: "q2-2",
        chapter_id: "c1-ch2",
        question: "True or False: Storing forward activations in memory is required for computing backward gradients.",
        options: ["True", "False"],
        correct_option: "True",
        explanation: "Backpropagation requires intermediate activations calculated during forward pass to compute layer gradients.",
        question_type: "TF"
      }
    );
    const course2Id = "course-distributed-systems";
    const course2 = {
      id: course2Id,
      user_id: "default-user-id",
      title: "Cloud Architecture & Distributed Systems",
      description: "Master distributed consensus, CAP theorem trade-offs, horizontal scaling, partition tolerance, and resilient event-driven architectures.",
      estimated_time: "8 Hours",
      difficulty_level: "Advanced",
      learning_objectives: [
        "Analyze consistency, availability, and partition tolerance trade-offs under the CAP theorem",
        "Design distributed consensus mechanisms using Raft leader election",
        "Implement resilient asynchronous messaging with idempotency and dead-letter queues"
      ],
      prerequisites: ["Networking fundamentals (TCP/IP, HTTP)", "Basic concurrency"],
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.courses.push(course2);
    const c2Ch1 = {
      id: "c2-ch1",
      course_id: course2Id,
      title: "Distributed Consistency & Consensus Protocols",
      order_index: 1,
      is_completed: false
    };
    this.data.chapters.push(c2Ch1);
    const c2T1 = { id: "c2-t1", chapter_id: "c2-ch1", title: "CAP Theorem & Eventual Consistency", order_index: 1 };
    this.data.topics.push(c2T1);
    const c2L1 = {
      id: "c2-l1",
      topic_id: "c2-t1",
      title: "The CAP Theorem & PACELC Trade-offs",
      explanations: [
        "Eric Brewers CAP theorem states that any distributed data store can simultaneously provide at most two of three guarantees: Consistency (every read receives the most recent write or an error), Availability (every non-failing node returns a non-error response), and Partition Tolerance (the system continues to operate despite arbitrary network message loss).",
        "The PACELC theorem expands CAP: If there is a Partition (P), how does your system trade Consistency (C) vs Availability (A); Else (E), how does it trade Latency (L) vs Consistency (C)? In real-world distributed databases like DynamoDB and Cassandra, eventual consistency is chosen to minimize read/write latency."
      ],
      key_takeaways: [
        "Network partitions are inevitable in physical distributed infrastructure, so Partition Tolerance is non-negotiable.",
        "CP systems (like etcd, ZooKeeper) favor strong consistency at the cost of returning errors during network isolation.",
        "AP systems (like Dynamo, Cassandra) favor high availability at the cost of transient stale reads."
      ],
      important_notes: [
        "Consistency in CAP refers to Linearizability (single-copy consistency), distinct from the C in ACID transactions."
      ],
      real_world_examples: [
        "Kubernetes uses etcd (a CP distributed key-value store powered by the Raft consensus protocol) to guarantee strict consistency for cluster state."
      ],
      summary: "Architecting distributed systems requires deliberate trade-offs between consistency, latency, and fault-tolerant availability.",
      order_index: 1
    };
    this.data.lessons.push(c2L1);
    this.data.quizzes.push(
      {
        id: "q3-1",
        chapter_id: "c2-ch1",
        question: "Under the CAP theorem, why can a distributed system not achieve both pure Consistency and Availability during a network partition?",
        options: [
          "Nodes on isolated partitions cannot communicate to agree on the latest state without stalling or serving stale data",
          "CPU registers overheat during network splits",
          "Data packets are permanently encrypted",
          "Distributed databases cannot use TCP/IP"
        ],
        correct_option: "Nodes on isolated partitions cannot communicate to agree on the latest state without stalling or serving stale data",
        explanation: "If nodes are partitioned, they must choose between continuing to serve requests without synchronization (sacrificing consistency) or rejecting requests (sacrificing availability).",
        question_type: "MCQ"
      },
      {
        id: "q3-2",
        chapter_id: "c2-ch1",
        question: "True or False: In the PACELC theorem, systems that are not currently partitioned must still make a trade-off between latency and consistency.",
        options: ["True", "False"],
        correct_option: "True",
        explanation: "Even in normal operating conditions without partitions, synchronizing data across replicas introduces network latency.",
        question_type: "TF"
      }
    );
    this.save();
  }
  // Synthesizes a structured course when user uploads a file or document
  synthesizeCourse(rawTitle, userId) {
    const cleanTitle = rawTitle.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
    const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    const newCourse = this.createCourse({
      user_id: userId,
      title: formattedTitle,
      description: `Comprehensive interactive curriculum generated from ${cleanTitle}. Includes structured modules, key insights, and assessments.`,
      estimated_time: "4 Hours",
      difficulty_level: "Intermediate",
      learning_objectives: [
        `Understand the core architectural principles of ${formattedTitle}`,
        `Master foundational methodologies, workflows, and key terminology`,
        `Apply theoretical frameworks to practical real-world challenges`
      ],
      prerequisites: ["Basic introductory knowledge", "Curiosity and problem-solving mindset"]
    });
    const ch1 = this.createChapter({
      course_id: newCourse.id,
      title: `Core Principles & Foundations of ${formattedTitle}`,
      order_index: 1,
      is_completed: false
    });
    const t1 = this.createTopic({
      chapter_id: ch1.id,
      title: "Foundational Concepts & Terminology",
      order_index: 1
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
        "Structure workflows sequentially to minimize compounding errors.",
        "Continuous verification and feedback loops ensure sustained reliability."
      ],
      important_notes: [
        "Always evaluate edge-case scenarios before finalizing system configurations."
      ],
      real_world_examples: [
        `Industry leaders apply these exact foundational practices to scale ${formattedTitle} reliably in production environments.`
      ],
      summary: `A rigorous grounding in ${formattedTitle} concepts and workflows.`,
      order_index: 1
    });
    this.createLesson({
      topic_id: t1.id,
      title: "Architectural Mechanisms & Workflows",
      explanations: [
        `Delving deeper into mechanical execution, this lesson analyzes how individual components interface under varying operational loads and conditions.`,
        `By decoupling complex pipelines into distinct modular boundaries, systems achieve both high cohesion and low coupling.`
      ],
      key_takeaways: [
        "Modularity enables parallel development and isolated debugging.",
        "Explicit contract interfaces prevent unintended side effects."
      ],
      important_notes: [
        "Maintain strict input sanitization and boundary validations at all interface points."
      ],
      real_world_examples: [
        "Enterprise microservices and modular pipelines implement these separation patterns."
      ],
      summary: "Key structural guidelines for building scalable, resilient implementations.",
      order_index: 2
    });
    this.createQuiz({
      chapter_id: ch1.id,
      question: `What is the primary objective of understanding ${formattedTitle} primitives?`,
      options: [
        "To establish a solid foundation for advanced implementation and troubleshooting",
        "To bypass all testing procedures",
        "To increase complexity unnecessarily",
        "To eliminate the need for documentation"
      ],
      correct_option: "To establish a solid foundation for advanced implementation and troubleshooting",
      explanation: "Grasping fundamental concepts ensures dependable decision-making when building complex architectures.",
      question_type: "MCQ"
    });
    this.createQuiz({
      chapter_id: ch1.id,
      question: "True or False: Decoupling complex systems into modular components improves both reliability and testability.",
      options: ["True", "False"],
      correct_option: "True",
      explanation: "Modularity confines failures to isolated units and simplifies automated testing.",
      question_type: "TF"
    });
    const ch2 = this.createChapter({
      course_id: newCourse.id,
      title: `Applied Strategies & Best Practices`,
      order_index: 2,
      is_completed: false
    });
    const t2 = this.createTopic({
      chapter_id: ch2.id,
      title: "Production Implementation & Optimization",
      order_index: 1
    });
    this.createLesson({
      topic_id: t2.id,
      title: "Performance Tuning & Reliability",
      explanations: [
        `Transitioning from conceptual design to high-throughput production requires systematic performance profiling and observability metrics.`,
        `By monitoring latency percentiles, error budgets, and resource utilization, practitioners ensure dependable operation under stress.`
      ],
      key_takeaways: [
        "Measure before optimizing: profile bottlenecks using empirical telemetry data.",
        "Implement automated health probes and graceful degradation fallbacks."
      ],
      important_notes: [
        "Premature optimization often introduces fragile complexity without meaningful gains."
      ],
      real_world_examples: [
        "High-scale web platforms utilize distributed telemetry to detect anomalies in real time."
      ],
      summary: "Practical approaches to hardening performance and operational reliability.",
      order_index: 1
    });
    this.createQuiz({
      chapter_id: ch2.id,
      question: "Which metric strategy is most effective before applying performance optimizations?",
      options: [
        "Empirical profiling and telemetry measurement to identify true bottlenecks",
        "Guessing which function is slowest",
        "Rewriting the entire codebase from scratch",
        "Disabling all logging and metrics"
      ],
      correct_option: "Empirical profiling and telemetry measurement to identify true bottlenecks",
      explanation: "Data-driven profiling ensures optimization efforts focus on high-impact bottlenecks.",
      question_type: "MCQ"
    });
    return newCourse;
  }
  // General CRUD helper operations
  generateUUID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  getUsers() {
    return this.data.users;
  }
  getUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  createUser(email, fullName) {
    const existing = this.getUserByEmail(email);
    if (existing) return existing;
    const newUser = {
      id: this.generateUUID(),
      email,
      full_name: fullName,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }
  // Courses
  getCourses(userId) {
    const userCourses = this.data.courses.filter((c) => c.user_id === userId || c.user_id === "default-user-id" || c.user_id === "starter");
    return userCourses.map((course) => {
      const chapters = this.data.chapters.filter((ch) => ch.course_id === course.id);
      const chapterIds = chapters.map((ch) => ch.id);
      const topics = this.data.topics.filter((t) => chapterIds.includes(t.chapter_id));
      const topicIds = topics.map((t) => t.id);
      const lessons = this.data.lessons.filter((l) => topicIds.includes(l.topic_id));
      const totalLessons = lessons.length;
      const completedLessons = lessons.filter((l) => {
        return this.data.user_progress.some((p) => p.user_id === userId && p.lesson_id === l.id && p.is_completed);
      }).length;
      const progressPercent = totalLessons > 0 ? Math.round(completedLessons / totalLessons * 100) : 0;
      return {
        ...course,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percent: progressPercent
      };
    });
  }
  getCourse(courseId) {
    return this.data.courses.find((c) => c.id === courseId);
  }
  createCourse(course) {
    const newCourse = {
      ...course,
      id: this.generateUUID(),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.courses.push(newCourse);
    this.save();
    return newCourse;
  }
  // Chapters, Topics, Lessons
  createChapter(chapter) {
    const newChapter = {
      ...chapter,
      id: this.generateUUID()
    };
    this.data.chapters.push(newChapter);
    this.save();
    return newChapter;
  }
  getChapters(courseId) {
    return this.data.chapters.filter((c) => c.course_id === courseId).sort((a, b) => a.order_index - b.order_index);
  }
  createTopic(topic) {
    const newTopic = {
      ...topic,
      id: this.generateUUID()
    };
    this.data.topics.push(newTopic);
    this.save();
    return newTopic;
  }
  getTopics(chapterId) {
    return this.data.topics.filter((t) => t.chapter_id === chapterId).sort((a, b) => a.order_index - b.order_index);
  }
  createLesson(lesson) {
    const newLesson = {
      ...lesson,
      id: this.generateUUID()
    };
    this.data.lessons.push(newLesson);
    this.save();
    return newLesson;
  }
  getLessons(topicId) {
    return this.data.lessons.filter((l) => l.topic_id === topicId).sort((a, b) => a.order_index - b.order_index);
  }
  // Full Course Hierarchy
  getCourseHierarchy(courseId, userId) {
    const course = this.getCourse(courseId);
    if (!course) return null;
    const chapters = this.getChapters(courseId);
    const enrichedChapters = chapters.map((ch) => {
      const topics = this.getTopics(ch.id);
      const enrichedTopics = topics.map((top) => {
        const lessons = this.getLessons(top.id);
        const enrichedLessons = lessons.map((les) => {
          const progress = this.data.user_progress.find(
            (p) => p.user_id === userId && p.lesson_id === les.id
          );
          return {
            ...les,
            is_completed: progress ? progress.is_completed : false
          };
        });
        return {
          ...top,
          lessons: enrichedLessons
        };
      });
      const chapterLessons = enrichedTopics.flatMap((t) => t.lessons);
      const totalChapterLessons = chapterLessons.length;
      const completedChapterLessons = chapterLessons.filter((l) => l.is_completed).length;
      const chapterCompleted = totalChapterLessons > 0 && totalChapterLessons === completedChapterLessons;
      return {
        ...ch,
        is_completed: chapterCompleted,
        topics: enrichedTopics
      };
    });
    return {
      course,
      chapters: enrichedChapters
    };
  }
  // Progress Tracking
  toggleLessonProgress(userId, lessonId, isCompleted) {
    let progress = this.data.user_progress.find((p) => p.user_id === userId && p.lesson_id === lessonId);
    if (progress) {
      progress.is_completed = isCompleted;
      progress.completed_at = isCompleted ? (/* @__PURE__ */ new Date()).toISOString() : null;
    } else {
      progress = {
        id: this.generateUUID(),
        user_id: userId,
        lesson_id: lessonId,
        is_completed: isCompleted,
        completed_at: isCompleted ? (/* @__PURE__ */ new Date()).toISOString() : null
      };
      this.data.user_progress.push(progress);
    }
    this.save();
    return { lesson_id: lessonId, is_completed: isCompleted };
  }
  // Quizzes
  createQuiz(quiz) {
    const newQuiz = {
      ...quiz,
      id: this.generateUUID()
    };
    this.data.quizzes.push(newQuiz);
    this.save();
    return newQuiz;
  }
  getQuizzesByChapter(chapterId) {
    return this.data.quizzes.filter((q) => q.chapter_id === chapterId);
  }
  // Quiz attempts
  createQuizAttempt(attempt) {
    const newAttempt = {
      ...attempt,
      id: this.generateUUID(),
      attempted_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.quiz_attempts.push(newAttempt);
    this.save();
    return newAttempt;
  }
  getQuizAttempts(userId, chapterId) {
    return this.data.quiz_attempts.filter((a) => {
      const matchUser = a.user_id === userId;
      const matchChapter = chapterId ? a.chapter_id === chapterId : true;
      return matchUser && matchChapter;
    }).sort((a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime());
  }
  // Chat History
  getChatHistory(userId, courseId) {
    return this.data.chat_history.filter((chat) => chat.user_id === userId && chat.course_id === courseId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  addChatMessage(message) {
    const newMessage = {
      ...message,
      id: this.generateUUID(),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.chat_history.push(newMessage);
    this.save();
    return newMessage;
  }
  // Global search across course modules
  globalSearch(userId, query) {
    if (!query || query.trim() === "") return [];
    const normalizedQuery = query.toLowerCase().trim();
    const userCourses = this.data.courses.filter((c) => c.user_id === userId || c.user_id === "default-user-id" || c.user_id === "starter");
    const courseIds = userCourses.map((c) => c.id);
    const results = [];
    userCourses.forEach((c) => {
      if (c.title.toLowerCase().includes(normalizedQuery) || c.description.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: "course",
          courseId: c.id,
          courseTitle: c.title,
          title: c.title,
          snippet: c.description.substring(0, 120) + (c.description.length > 120 ? "..." : ""),
          id: c.id
        });
      }
    });
    const chapters = this.data.chapters.filter((ch) => courseIds.includes(ch.course_id));
    chapters.forEach((ch) => {
      const course = userCourses.find((c) => c.id === ch.course_id);
      if (course && ch.title.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: "chapter",
          courseId: ch.course_id,
          courseTitle: course.title,
          title: ch.title,
          snippet: `Chapter in ${course.title}`,
          id: ch.id
        });
      }
    });
    const chapterIds = chapters.map((ch) => ch.id);
    const topics = this.data.topics.filter((t) => chapterIds.includes(t.chapter_id));
    topics.forEach((t) => {
      const chapter = chapters.find((ch) => ch.id === t.chapter_id);
      const course = chapter ? userCourses.find((c) => c.id === chapter.course_id) : null;
      if (chapter && course && t.title.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: "topic",
          courseId: chapter.course_id,
          courseTitle: course.title,
          title: t.title,
          snippet: `Topic in chapter: ${chapter.title}`,
          id: t.id
        });
      }
    });
    const topicIds = topics.map((t) => t.id);
    const lessons = this.data.lessons.filter((l) => topicIds.includes(l.topic_id));
    lessons.forEach((l) => {
      const topic = topics.find((t) => t.id === l.topic_id);
      const chapter = topic ? chapters.find((ch) => ch.id === topic.chapter_id) : null;
      const course = chapter ? userCourses.find((c) => c.id === chapter.course_id) : null;
      if (!chapter || !course) return;
      const explanationsMatch = l.explanations.some((p) => p.toLowerCase().includes(normalizedQuery));
      const takeawaysMatch = l.key_takeaways.some((p) => p.toLowerCase().includes(normalizedQuery));
      const examplesMatch = l.real_world_examples.some((p) => p.toLowerCase().includes(normalizedQuery));
      const summaryMatch = l.summary.toLowerCase().includes(normalizedQuery);
      if (l.title.toLowerCase().includes(normalizedQuery) || explanationsMatch || takeawaysMatch || examplesMatch || summaryMatch) {
        let snippet = "";
        if (l.title.toLowerCase().includes(normalizedQuery)) {
          snippet = l.summary ? l.summary.substring(0, 120) + "..." : "Lesson module";
        } else if (explanationsMatch) {
          const matchParagraph = l.explanations.find((p) => p.toLowerCase().includes(normalizedQuery)) || "";
          snippet = "... " + matchParagraph.substring(Math.max(0, matchParagraph.toLowerCase().indexOf(normalizedQuery) - 40), Math.min(matchParagraph.length, matchParagraph.toLowerCase().indexOf(normalizedQuery) + 80)) + " ...";
        } else {
          snippet = l.summary ? l.summary.substring(0, 120) + "..." : "Lesson module content";
        }
        results.push({
          type: "lesson",
          courseId: chapter.course_id,
          courseTitle: course.title,
          title: l.title,
          snippet,
          id: l.id
        });
      }
    });
    return results;
  }
  // Simple RAG retrieval chunk lookup across the course text segments
  retrieveCourseContext(courseId, query, limit = 4) {
    const chapters = this.getChapters(courseId);
    const chapterIds = chapters.map((ch) => ch.id);
    const topics = this.data.topics.filter((t) => chapterIds.includes(t.chapter_id));
    const topicIds = topics.map((t) => t.id);
    const lessons = this.data.lessons.filter((l) => topicIds.includes(l.topic_id));
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (queryWords.length === 0) {
      return lessons.slice(0, 2).map((l) => {
        return `[Lesson: ${l.title}]
Explanations: ${l.explanations.join("\n")}
Takeaways: ${l.key_takeaways.join(", ")}`;
      }).join("\n\n");
    }
    const scoredChunks = lessons.map((lesson) => {
      let score = 0;
      const lessonText = [
        lesson.title,
        ...lesson.explanations,
        ...lesson.key_takeaways,
        ...lesson.important_notes,
        ...lesson.real_world_examples,
        lesson.summary
      ].join(" ").toLowerCase();
      queryWords.forEach((word) => {
        const regex = new RegExp("\\b" + word + "\\b", "g");
        const matches = lessonText.match(regex);
        if (matches) {
          score += matches.length * 2;
        } else if (lessonText.includes(word)) {
          score += 1;
        }
      });
      return { lesson, score };
    });
    const topChunks = scoredChunks.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    const selected = topChunks.length > 0 ? topChunks.map((c) => c.lesson) : lessons.slice(0, 2);
    return selected.map((l) => {
      return `### LESSON: ${l.title}
Explanations:
${l.explanations.join("\n")}

Key Takeaways:
${l.key_takeaways.map((t) => `- ${t}`).join("\n")}

Important Notes:
${l.important_notes.map((n) => `* ${n}`).join("\n")}

Real-World Implementation:
${l.real_world_examples.join("\n")}

Summary: ${l.summary}`;
    }).join("\n\n---\n\n");
  }
};
var db = new DatabaseEngine();

// server.ts
var import_meta = {};
var require2 = (0, import_module.createRequire)(import_meta.url);
var pdfParse = require2("pdf-parse");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
var storage = import_multer.default.memoryStorage();
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  // 40MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF documents are allowed."));
    }
  }
});
var aiInstance = null;
function getGeminiClient() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets.");
    }
    aiInstance = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}
function getRelevantChunk(rawText, title, length = 3e4) {
  if (!rawText) return "No context material available.";
  const keywords = title.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 3);
  if (keywords.length === 0) {
    return rawText.slice(0, length);
  }
  let bestIdx = 0;
  let maxMatches = 0;
  const lowercaseText = rawText.toLowerCase();
  for (let i = 0; i < lowercaseText.length; i += 1e3) {
    const slice = lowercaseText.slice(i, i + 1e4);
    let matches = 0;
    keywords.forEach((word) => {
      if (slice.includes(word)) matches++;
    });
    if (matches > maxMatches) {
      maxMatches = matches;
      bestIdx = i;
    }
  }
  const start = Math.max(0, bestIdx - 3e3);
  const end = Math.min(rawText.length, start + length);
  return rawText.slice(start, end);
}
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, full_name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }
    const name = full_name || email.split("@")[0];
    const user = db.createUser(email, name);
    return res.status(200).json({
      token: `mock-supabase-jwt-for-${user.id}`,
      user
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message || "Authentication failed." });
  }
});
app.get("/api/courses", (req, res) => {
  try {
    const userId = req.query.userId || "default-user-id";
    const courses = db.getCourses(userId);
    return res.status(200).json(courses);
  } catch (error) {
    console.error("Get courses error:", error);
    return res.status(500).json({ error: "Failed to retrieve courses." });
  }
});
app.get("/api/courses/:id", (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.query.userId || "default-user-id";
    const hierarchy = db.getCourseHierarchy(courseId, userId);
    if (!hierarchy) {
      return res.status(404).json({ error: "Course not found." });
    }
    return res.status(200).json(hierarchy);
  } catch (error) {
    console.error("Get course hierarchy error:", error);
    return res.status(500).json({ error: "Failed to retrieve course details." });
  }
});
app.post("/api/courses/generate", upload.single("pdf"), async (req, res) => {
  try {
    const userId = req.body.userId || "default-user-id";
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No PDF file was uploaded. Please choose a valid PDF." });
    }
    console.log("[EduCraft AI] Extracting text from PDF...");
    let rawText = "";
    let useGeminiFallback = false;
    try {
      const pdfData = await pdfParse(file.buffer);
      rawText = pdfData.text;
      if (!rawText || rawText.trim().length < 100) {
        console.log("[EduCraft AI] PDF parsed but contained less than 100 characters. Activating Gemini Multimodal/OCR fallback...");
        useGeminiFallback = true;
      }
    } catch (parseErr) {
      console.error("[EduCraft AI] PDF Parse Error:", parseErr);
      console.log("[EduCraft AI] Activating Gemini PDF parsing fallback...");
      useGeminiFallback = true;
    }
    if (useGeminiFallback) {
      try {
        const ai2 = getGeminiClient();
        console.log("[EduCraft AI] Running Gemini native multimodal PDF extraction...");
        const extractionResponse = await ai2.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: file.buffer.toString("base64")
              }
            },
            {
              text: "Extract and return all readable text, chapters, headings, technical terms, definitions, formulas, and educational content from this document. Output only the extracted plain text with no headings of your own, preambles, notes, or formatting. Preserve the natural structure of the text as much as possible."
            }
          ]
        });
        rawText = extractionResponse.text || "";
        console.log("[EduCraft AI] Gemini native extraction completed. Extracted length:", rawText.length);
      } catch (geminiParseErr) {
        console.error("[EduCraft AI] Gemini PDF Extraction Fallback Error:", geminiParseErr);
        return res.status(400).json({
          error: "Failed to parse PDF content. Ensure the document is not password-protected or corrupted."
        });
      }
    }
    const cleanedText = rawText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[^\x20-\x7E\n]/g, "").trim();
    if (cleanedText.length < 100) {
      return res.status(400).json({
        error: "The uploaded PDF does not contain sufficient extractable text. Please ensure it is a digital textbook and not an image-only scan."
      });
    }
    const ai = getGeminiClient();
    console.log("[EduCraft AI] Architecting course syllabus outline...");
    const syllabusResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze this raw text block and output a structured course syllabus outline with titles, summary, difficulty assessment, and a nested array of chapters, topics, and lesson titles. Limit to 2 or 3 high-impact chapters, with 1 topic per chapter, and 1 or 2 lessons per topic to avoid prompt truncation and rate limits. Make the chapters logical and sequential.
      
Raw Extracted Text:
${cleanedText.slice(0, 15e4)}`,
      // limit raw text slice to prevent prompt blowing out
      config: {
        systemInstruction: "You are a master educational curriculum architect. You process raw unstructured text extracted from documents and structure it into a logical, highly educational e-learning course outline. You must output an object adhering exactly to the given JSON schema. Do not output markdown, preambles, notes, or wrap code in triple backticks.",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            title: { type: import_genai.Type.STRING, description: "Descriptive title of the course" },
            description: { type: import_genai.Type.STRING, description: "Syllabus description summary" },
            estimatedTime: { type: import_genai.Type.STRING, description: 'Estimated time to complete, e.g. "8 Hours"' },
            difficultyLevel: { type: import_genai.Type.STRING, description: "Difficulty level: Beginner | Intermediate | Advanced" },
            learningObjectives: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "Syllabus goals" },
            prerequisites: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "Assumed basic knowledge" },
            chapters: {
              type: import_genai.Type.ARRAY,
              description: "List of instructional chapters",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  chapterTitle: { type: import_genai.Type.STRING },
                  orderIndex: { type: import_genai.Type.INTEGER },
                  topics: {
                    type: import_genai.Type.ARRAY,
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        topicTitle: { type: import_genai.Type.STRING },
                        orderIndex: { type: import_genai.Type.INTEGER },
                        lessonTitles: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } }
                      },
                      required: ["topicTitle", "orderIndex", "lessonTitles"]
                    }
                  }
                },
                required: ["chapterTitle", "orderIndex", "topics"]
              }
            }
          },
          required: ["title", "description", "estimatedTime", "difficultyLevel", "learningObjectives", "prerequisites", "chapters"]
        }
      }
    });
    let syllabus;
    try {
      syllabus = JSON.parse(syllabusResponse.text.trim());
    } catch (parseErr) {
      console.error("Syllabus parsing error:", syllabusResponse.text);
      return res.status(500).json({ error: "AI designed an invalid syllabus schema. Please try again." });
    }
    console.log("[EduCraft AI] Syllabus created. Generating rich lesson units & chapter quizzes in parallel...");
    const dbCourse = db.createCourse({
      user_id: userId,
      title: syllabus.title,
      description: syllabus.description,
      estimated_time: syllabus.estimatedTime,
      difficulty_level: syllabus.difficultyLevel,
      learning_objectives: syllabus.learningObjectives,
      prerequisites: syllabus.prerequisites
    });
    const lessonPromises = [];
    const quizPromises = [];
    for (const rawChapter of syllabus.chapters) {
      const dbChapter = db.createChapter({
        course_id: dbCourse.id,
        title: rawChapter.chapterTitle,
        order_index: rawChapter.orderIndex,
        is_completed: false
      });
      let chapterTopicContents = [];
      for (const rawTopic of rawChapter.topics) {
        const dbTopic = db.createTopic({
          chapter_id: dbChapter.id,
          title: rawTopic.topicTitle,
          order_index: rawTopic.orderIndex
        });
        for (let lIndex = 0; lIndex < rawTopic.lessonTitles.length; lIndex++) {
          const lessonTitle = rawTopic.lessonTitles[lIndex];
          const orderIndex = lIndex + 1;
          const chunkContext = getRelevantChunk(cleanedText, `${rawChapter.chapterTitle} ${rawTopic.topicTitle} ${lessonTitle}`);
          const lessonPromise = ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `For the course titled '${syllabus.title}', build out the full educational text body for the specific lesson unit titled '${lessonTitle}' within Chapter '${rawChapter.chapterTitle}' and Topic '${rawTopic.topicTitle}'. Use the following raw source material context. Include detailed definitions, examples, mechanical details, and closing summaries.

Raw Source Material Context:
${chunkContext}`,
            config: {
              systemInstruction: "You are an elite textbook writer and domain expert. You construct detailed, highly academic, easy-to-understand lesson modules complete with definitions, actionable takeaways, edge cases, and practical real-world scenarios based on specific content boundaries. Output exactly in JSON format adhering to the response schema.",
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  lessonTitle: { type: import_genai.Type.STRING },
                  explanations: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "At least 2 highly detailed educational paragraphs." },
                  keyTakeaways: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "Practical core takeaways or rules." },
                  importantNotes: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "Crucial caveat warnings or nuances." },
                  realWorldExamples: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "Concrete real world implementation or case studies." },
                  summary: { type: import_genai.Type.STRING, description: "One comprehensive closing summary paragraph." }
                },
                required: ["lessonTitle", "explanations", "keyTakeaways", "importantNotes", "realWorldExamples", "summary"]
              }
            }
          }).then((resObj) => {
            try {
              const details = JSON.parse(resObj.text.trim());
              const savedLesson = db.createLesson({
                topic_id: dbTopic.id,
                title: lessonTitle,
                explanations: details.explanations || [],
                key_takeaways: details.keyTakeaways || [],
                important_notes: details.importantNotes || [],
                real_world_examples: details.realWorldExamples || [],
                summary: details.summary || "",
                order_index: orderIndex
              });
              chapterTopicContents.push(`Lesson: ${lessonTitle}
${(details.explanations || []).join("\n")}`);
              return savedLesson;
            } catch (err) {
              console.error(`Failed to parse lesson details for ${lessonTitle}:`, err);
              return db.createLesson({
                topic_id: dbTopic.id,
                title: lessonTitle,
                explanations: ["This unit explores core structures. Refer to study materials for details."],
                key_takeaways: ["Understand the core terms of this module."],
                important_notes: ["Always practice clean concept isolation."],
                real_world_examples: ["Corporate operations use this for structural planning."],
                summary: "An introductory module bridging concepts.",
                order_index: orderIndex
              });
            }
          });
          lessonPromises.push(lessonPromise);
        }
      }
      const quizPromise = Promise.all(lessonPromises).then(async () => {
        const chapterCombinedText = chapterTopicContents.join("\n\n") || `Chapter: ${rawChapter.chapterTitle}`;
        console.log(`[EduCraft AI] Generating chapter quiz for: ${rawChapter.chapterTitle}...`);
        try {
          const quizResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Generate a 5-question comprehensive chapter quiz covering the content found in this text body. Include a mixture of Multiple Choice (MCQ), True/False (TF), and Short Answer (SHORT) formats.
            
Chapter Content:
${chapterCombinedText.slice(0, 8e4)}`,
            config: {
              systemInstruction: "You are a psychometric test designer. Generate evaluations that measure core concepts, analytical application, and factual retention. Output exclusively in standard JSON matching the given responseSchema.",
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  quizzes: {
                    type: import_genai.Type.ARRAY,
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        question: { type: import_genai.Type.STRING },
                        questionType: { type: import_genai.Type.STRING, description: "Must be MCQ, TF, or SHORT" },
                        options: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "Array of 4 options for MCQ, 2 options (True, False) for TF, or empty for SHORT" },
                        correctOption: { type: import_genai.Type.STRING, description: "The exact text string match of the correct option, or short answer grading keyword" },
                        explanation: { type: import_genai.Type.STRING, description: "Explanation explaining why this option is correct." }
                      },
                      required: ["question", "questionType", "options", "correctOption", "explanation"]
                    }
                  }
                },
                required: ["quizzes"]
              }
            }
          });
          const parsedQuiz = JSON.parse(quizResponse.text.trim());
          for (const q of parsedQuiz.quizzes) {
            db.createQuiz({
              chapter_id: dbChapter.id,
              question: q.question,
              options: q.options || [],
              correct_option: q.correctOption,
              explanation: q.explanation,
              question_type: q.questionType === "TF" ? "TF" : q.questionType === "SHORT" ? "SHORT" : "MCQ"
            });
          }
        } catch (quizErr) {
          console.error(`Failed to generate quiz for chapter ${rawChapter.chapterTitle}:`, quizErr);
          const fallbackQuizzes = [
            {
              question: `What is the primary theme explored in ${rawChapter.chapterTitle}?`,
              options: ["Core Mechanics", "Secondary Elements", "Environmental Variables", "Historical Context"],
              correctOption: "Core Mechanics",
              explanation: `The chapter centers on outlining the essential concepts and fundamental structures.`,
              questionType: "MCQ"
            },
            {
              question: `True or False: The principles taught in this chapter are highly applicable to practical real-world problems.`,
              options: ["True", "False"],
              correctOption: "True",
              explanation: `Every instructional unit is backed by solid industry application guidelines.`,
              questionType: "TF"
            }
          ];
          for (const q of fallbackQuizzes) {
            db.createQuiz({
              chapter_id: dbChapter.id,
              question: q.question,
              options: q.options,
              correct_option: q.correctOption,
              explanation: q.explanation,
              question_type: q.questionType
            });
          }
        }
      });
      quizPromises.push(quizPromise);
    }
    await Promise.all([...lessonPromises, ...quizPromises]);
    console.log(`[EduCraft AI] E-Course ${dbCourse.title} generated successfully!`);
    return res.status(200).json({ course_id: dbCourse.id });
  } catch (error) {
    console.error("Course generation failed:", error);
    return res.status(500).json({ error: error.message || "Course generation failed." });
  }
});
app.post("/api/progress/toggle", (req, res) => {
  try {
    const { lesson_id, is_completed } = req.body;
    const userId = req.body.userId || "default-user-id";
    if (!lesson_id) {
      return res.status(400).json({ error: "Lesson ID is required." });
    }
    const progress = db.toggleLessonProgress(userId, lesson_id, !!is_completed);
    return res.status(200).json(progress);
  } catch (error) {
    console.error("Toggle progress error:", error);
    return res.status(500).json({ error: "Failed to update progress." });
  }
});
app.get("/api/quizzes/:chapter_id", (req, res) => {
  try {
    const chapterId = req.params.chapter_id;
    const quizzes = db.getQuizzesByChapter(chapterId);
    return res.status(200).json(quizzes);
  } catch (error) {
    console.error("Get quizzes error:", error);
    return res.status(500).json({ error: "Failed to load quizzes." });
  }
});
app.post("/api/quizzes/submit", (req, res) => {
  try {
    const { chapter_id, answers } = req.body;
    const userId = req.body.userId || "default-user-id";
    if (!chapter_id || !answers) {
      return res.status(400).json({ error: "Chapter ID and answers object are required." });
    }
    const quizzes = db.getQuizzesByChapter(chapter_id);
    if (quizzes.length === 0) {
      return res.status(404).json({ error: "No quiz questions exist for this chapter." });
    }
    let score = 0;
    const details = quizzes.map((q) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer?.trim().toLowerCase() === q.correct_option.trim().toLowerCase();
      if (isCorrect) score++;
      return {
        quiz_id: q.id,
        question: q.question,
        user_answer: userAnswer || "Unanswered",
        correct_answer: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation
      };
    });
    const attempt = db.createQuizAttempt({
      user_id: userId,
      chapter_id,
      score,
      total_questions: quizzes.length
    });
    return res.status(200).json({
      attempt_id: attempt.id,
      score,
      total_questions: quizzes.length,
      percentage: Math.round(score / quizzes.length * 100),
      questions: details
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return res.status(500).json({ error: "Failed to grade quiz submissions." });
  }
});
app.post("/api/chat/message", async (req, res) => {
  try {
    const { prompt, course_id } = req.body;
    const userId = req.body.userId || "default-user-id";
    if (!prompt || !course_id) {
      return res.status(400).json({ error: "Prompt and Course ID are required." });
    }
    const contextMaterial = db.retrieveCourseContext(course_id, prompt);
    db.addChatMessage({
      user_id: userId,
      course_id,
      sender: "user",
      message: prompt
    });
    const ai = getGeminiClient();
    console.log("[EduCraft AI] Prompting chatbot with course context...");
    const chatbotResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the friendly, professional AI E-Learning companion for the course 'EduCraft AI'. Your goal is to guide students, explain technical definitions, simplify complex terms, and summarize chapter themes.

Use the retrieved course materials below as your source context boundaries. If a user asks a question unrelated to the course or the context materials, try to guide them back to course concepts gracefully. Give structured, helpful markdown answers with concise bullet points.

RELEVANT STUDY SOURCE MATERIAL:
${contextMaterial}

USER QUESTION:
${prompt}`
    });
    const aiMessage = chatbotResponse.text || "I encountered an issue generating a response. Please rephrase your query.";
    db.addChatMessage({
      user_id: userId,
      course_id,
      sender: "ai",
      message: aiMessage
    });
    return res.status(200).json({ response: aiMessage });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: error.message || "Companion chatbot failure." });
  }
});
app.get("/api/chat/history", (req, res) => {
  try {
    const { course_id } = req.query;
    const userId = req.query.userId || "default-user-id";
    if (!course_id) {
      return res.status(400).json({ error: "Course ID is required." });
    }
    const history = db.getChatHistory(userId, course_id);
    return res.status(200).json(history);
  } catch (error) {
    console.error("Chat history error:", error);
    return res.status(500).json({ error: "Failed to retrieve chat history." });
  }
});
app.get("/api/search", (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.query.userId || "default-user-id";
    const results = db.globalSearch(userId, q);
    return res.status(200).json(results);
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: "Search failed." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EduCraft AI Server] Running on http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
//# sourceMappingURL=server.cjs.map
