import express from 'express';
import path from 'path';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './src/db/db.ts';

const app = express();
const PORT = 3000;

// Configure JSON parser and URL-encoded body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure Multer for PDF file uploads (using memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 40 * 1024 * 1024 }, // 40MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed.'));
    }
  },
});

// Lazy-initialization helper for GoogleGenAI SDK to prevent startup crashes
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Utility to find the most relevant section of raw text for a specific topic
function getRelevantChunk(rawText: string, title: string, length = 30000): string {
  if (!rawText) return 'No context material available.';
  const keywords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (keywords.length === 0) {
    return rawText.slice(0, length);
  }

  let bestIdx = 0;
  let maxMatches = 0;
  const lowercaseText = rawText.toLowerCase();

  // Sliding window search through the raw document text
  for (let i = 0; i < lowercaseText.length; i += 1000) {
    const slice = lowercaseText.slice(i, i + 10000);
    let matches = 0;
    keywords.forEach((word) => {
      if (slice.includes(word)) matches++;
    });

    if (matches > maxMatches) {
      maxMatches = matches;
      bestIdx = i;
    }
  }

  const start = Math.max(0, bestIdx - 3000);
  const end = Math.min(rawText.length, start + length);
  return rawText.slice(start, end);
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// POST /api/auth/login
// Supports mock single-click and regular email logins, returning tokens and user profiles
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, full_name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const name = full_name || email.split('@')[0];
    const user = db.createUser(email, name);

    return res.status(200).json({
      token: `mock-supabase-jwt-for-${user.id}`,
      user,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Authentication failed.' });
  }
});

// GET /api/courses
// Returns an array of generated courses for the authenticated user, complete with completion rates
app.get('/api/courses', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default-user-id';
    const courses = db.getCourses(userId);
    return res.status(200).json(courses);
  } catch (error: any) {
    console.error('Get courses error:', error);
    return res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
});

// GET /api/courses/{id}
// Fetches the full hierarchical structure of a specific course (Chapters -> Topics -> Lessons) with lesson completion state
app.get('/api/courses/:id', (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = (req.query.userId as string) || 'default-user-id';

    const hierarchy = db.getCourseHierarchy(courseId, userId);
    if (!hierarchy) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    return res.status(200).json(hierarchy);
  } catch (error: any) {
    console.error('Get course hierarchy error:', error);
    return res.status(500).json({ error: 'Failed to retrieve course details.' });
  }
});

// POST /api/courses/generate
// Accepts a multipart PDF, extracts contents, designs a syllabus outline, populates full e-course, and saves to database
app.post('/api/courses/generate', upload.single('pdf'), async (req, res) => {
  try {
    const userId = req.body.userId || 'default-user-id';
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No PDF file was uploaded. Please choose a valid PDF.' });
    }

    // Step 1: Text Extraction Step
    console.log('[EduCraft AI] Extracting text from PDF...');
    let rawText = '';
    let useGeminiFallback = false;

    try {
      const pdfData = await pdfParse(file.buffer);
      rawText = pdfData.text;
      
      if (!rawText || rawText.trim().length < 100) {
        console.log('[EduCraft AI] PDF parsed but contained less than 100 characters. Activating Gemini Multimodal/OCR fallback...');
        useGeminiFallback = true;
      }
    } catch (parseErr: any) {
      console.error('[EduCraft AI] PDF Parse Error:', parseErr);
      console.log('[EduCraft AI] Activating Gemini PDF parsing fallback...');
      useGeminiFallback = true;
    }

    if (useGeminiFallback) {
      try {
        const ai = getGeminiClient();
        console.log('[EduCraft AI] Running Gemini native multimodal PDF extraction...');
        const extractionResponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: file.buffer.toString('base64'),
              },
            },
            {
              text: 'Extract and return all readable text, chapters, headings, technical terms, definitions, formulas, and educational content from this document. Output only the extracted plain text with no headings of your own, preambles, notes, or formatting. Preserve the natural structure of the text as much as possible.',
            },
          ],
        });
        rawText = extractionResponse.text || '';
        console.log('[EduCraft AI] Gemini native extraction completed. Extracted length:', rawText.length);
      } catch (geminiParseErr: any) {
        console.error('[EduCraft AI] Gemini PDF Extraction Fallback Error:', geminiParseErr);
        return res.status(400).json({
          error: 'Failed to parse PDF content. Ensure the document is not password-protected or corrupted.',
        });
      }
    }

    // Clean duplicate newlines, artifact symbols, and normalize spacing
    const cleanedText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\x20-\x7E\n]/g, '') // strip non-printable characters for clean prompting
      .trim();

    if (cleanedText.length < 100) {
      return res.status(400).json({
        error: 'The uploaded PDF does not contain sufficient extractable text. Please ensure it is a digital textbook and not an image-only scan.',
      });
    }

    const ai = getGeminiClient();

    // Step 2: Architecture Step - Call Gemini with the raw content to construct a verified syllabus outline
    console.log('[EduCraft AI] Architecting course syllabus outline...');
    const syllabusResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze this raw text block and output a structured course syllabus outline with titles, summary, difficulty assessment, and a nested array of chapters, topics, and lesson titles. Limit to 2 or 3 high-impact chapters, with 1 topic per chapter, and 1 or 2 lessons per topic to avoid prompt truncation and rate limits. Make the chapters logical and sequential.
      
Raw Extracted Text:
${cleanedText.slice(0, 150000)}`, // limit raw text slice to prevent prompt blowing out
      config: {
        systemInstruction: 'You are a master educational curriculum architect. You process raw unstructured text extracted from documents and structure it into a logical, highly educational e-learning course outline. You must output an object adhering exactly to the given JSON schema. Do not output markdown, preambles, notes, or wrap code in triple backticks.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Descriptive title of the course' },
            description: { type: Type.STRING, description: 'Syllabus description summary' },
            estimatedTime: { type: Type.STRING, description: 'Estimated time to complete, e.g. "8 Hours"' },
            difficultyLevel: { type: Type.STRING, description: 'Difficulty level: Beginner | Intermediate | Advanced' },
            learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Syllabus goals' },
            prerequisites: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Assumed basic knowledge' },
            chapters: {
              type: Type.ARRAY,
              description: 'List of instructional chapters',
              items: {
                type: Type.OBJECT,
                properties: {
                  chapterTitle: { type: Type.STRING },
                  orderIndex: { type: Type.INTEGER },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        topicTitle: { type: Type.STRING },
                        orderIndex: { type: Type.INTEGER },
                        lessonTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['topicTitle', 'orderIndex', 'lessonTitles'],
                    },
                  },
                },
                required: ['chapterTitle', 'orderIndex', 'topics'],
              },
            },
          },
          required: ['title', 'description', 'estimatedTime', 'difficultyLevel', 'learningObjectives', 'prerequisites', 'chapters'],
        },
      },
    });

    let syllabus: any;
    try {
      syllabus = JSON.parse(syllabusResponse.text!.trim());
    } catch (parseErr) {
      console.error('Syllabus parsing error:', syllabusResponse.text);
      return res.status(500).json({ error: 'AI designed an invalid syllabus schema. Please try again.' });
    }

    // Step 3: Write Course and structural scaffolding to DB within our transaction
    console.log('[EduCraft AI] Syllabus created. Generating rich lesson units & chapter quizzes in parallel...');
    const dbCourse = db.createCourse({
      user_id: userId,
      title: syllabus.title,
      description: syllabus.description,
      estimated_time: syllabus.estimatedTime,
      difficulty_level: syllabus.difficultyLevel,
      learning_objectives: syllabus.learningObjectives,
      prerequisites: syllabus.prerequisites,
    });

    // Populate all chapters, topics, lessons, and quizzes
    // We will generate lesson details and chapter quizzes in parallel
    const lessonPromises: Array<Promise<any>> = [];
    const quizPromises: Array<Promise<any>> = [];

    for (const rawChapter of syllabus.chapters) {
      const dbChapter = db.createChapter({
        course_id: dbCourse.id,
        title: rawChapter.chapterTitle,
        order_index: rawChapter.orderIndex,
        is_completed: false,
      });

      // We'll prepare chapter contents to pass to the quiz generator later
      let chapterTopicContents: string[] = [];

      for (const rawTopic of rawChapter.topics) {
        const dbTopic = db.createTopic({
          chapter_id: dbChapter.id,
          title: rawTopic.topicTitle,
          order_index: rawTopic.orderIndex,
        });

        for (let lIndex = 0; lIndex < rawTopic.lessonTitles.length; lIndex++) {
          const lessonTitle = rawTopic.lessonTitles[lIndex];
          const orderIndex = lIndex + 1;

          // Retrieve semantic chunk of technical text based on lesson keywords
          const chunkContext = getRelevantChunk(cleanedText, `${rawChapter.chapterTitle} ${rawTopic.topicTitle} ${lessonTitle}`);

          // Define parallel promise for detailed lesson text body generation
          const lessonPromise = ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `For the course titled '${syllabus.title}', build out the full educational text body for the specific lesson unit titled '${lessonTitle}' within Chapter '${rawChapter.chapterTitle}' and Topic '${rawTopic.topicTitle}'. Use the following raw source material context. Include detailed definitions, examples, mechanical details, and closing summaries.

Raw Source Material Context:
${chunkContext}`,
            config: {
              systemInstruction: 'You are an elite textbook writer and domain expert. You construct detailed, highly academic, easy-to-understand lesson modules complete with definitions, actionable takeaways, edge cases, and practical real-world scenarios based on specific content boundaries. Output exactly in JSON format adhering to the response schema.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  lessonTitle: { type: Type.STRING },
                  explanations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'At least 2 highly detailed educational paragraphs.' },
                  keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Practical core takeaways or rules.' },
                  importantNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Crucial caveat warnings or nuances.' },
                  realWorldExamples: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Concrete real world implementation or case studies.' },
                  summary: { type: Type.STRING, description: 'One comprehensive closing summary paragraph.' },
                },
                required: ['lessonTitle', 'explanations', 'keyTakeaways', 'importantNotes', 'realWorldExamples', 'summary'],
              },
            },
          }).then((resObj) => {
            try {
              const details = JSON.parse(resObj.text!.trim());
              const savedLesson = db.createLesson({
                topic_id: dbTopic.id,
                title: lessonTitle,
                explanations: details.explanations || [],
                key_takeaways: details.keyTakeaways || [],
                important_notes: details.importantNotes || [],
                real_world_examples: details.realWorldExamples || [],
                summary: details.summary || '',
                order_index: orderIndex,
              });
              chapterTopicContents.push(`Lesson: ${lessonTitle}\n${(details.explanations || []).join('\n')}`);
              return savedLesson;
            } catch (err) {
              console.error(`Failed to parse lesson details for ${lessonTitle}:`, err);
              // Fallback lesson creation so the transaction doesn't fail
              return db.createLesson({
                topic_id: dbTopic.id,
                title: lessonTitle,
                explanations: ['This unit explores core structures. Refer to study materials for details.'],
                key_takeaways: ['Understand the core terms of this module.'],
                important_notes: ['Always practice clean concept isolation.'],
                real_world_examples: ['Corporate operations use this for structural planning.'],
                summary: 'An introductory module bridging concepts.',
                order_index: orderIndex,
              });
            }
          });

          lessonPromises.push(lessonPromise);
        }
      }

      // Generate a 5-question comprehensive quiz for this Chapter based on its chapters content
      const quizPromise = Promise.all(lessonPromises).then(async () => {
        const chapterCombinedText = chapterTopicContents.join('\n\n') || `Chapter: ${rawChapter.chapterTitle}`;
        console.log(`[EduCraft AI] Generating chapter quiz for: ${rawChapter.chapterTitle}...`);

        try {
          const quizResponse = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Generate a 5-question comprehensive chapter quiz covering the content found in this text body. Include a mixture of Multiple Choice (MCQ), True/False (TF), and Short Answer (SHORT) formats.
            
Chapter Content:
${chapterCombinedText.slice(0, 80000)}`,
            config: {
              systemInstruction: 'You are a psychometric test designer. Generate evaluations that measure core concepts, analytical application, and factual retention. Output exclusively in standard JSON matching the given responseSchema.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  quizzes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        questionType: { type: Type.STRING, description: 'Must be MCQ, TF, or SHORT' },
                        options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Array of 4 options for MCQ, 2 options (True, False) for TF, or empty for SHORT' },
                        correctOption: { type: Type.STRING, description: 'The exact text string match of the correct option, or short answer grading keyword' },
                        explanation: { type: Type.STRING, description: 'Explanation explaining why this option is correct.' },
                      },
                      required: ['question', 'questionType', 'options', 'correctOption', 'explanation'],
                    },
                  },
                },
                required: ['quizzes'],
              },
            },
          });

          const parsedQuiz = JSON.parse(quizResponse.text!.trim());
          for (const q of parsedQuiz.quizzes) {
            db.createQuiz({
              chapter_id: dbChapter.id,
              question: q.question,
              options: q.options || [],
              correct_option: q.correctOption,
              explanation: q.explanation,
              question_type: q.questionType === 'TF' ? 'TF' : q.questionType === 'SHORT' ? 'SHORT' : 'MCQ',
            });
          }
        } catch (quizErr) {
          console.error(`Failed to generate quiz for chapter ${rawChapter.chapterTitle}:`, quizErr);
          // Insert 3 standard fallback questions so the user has quiz experiences
          const fallbackQuizzes = [
            {
              question: `What is the primary theme explored in ${rawChapter.chapterTitle}?`,
              options: ['Core Mechanics', 'Secondary Elements', 'Environmental Variables', 'Historical Context'],
              correctOption: 'Core Mechanics',
              explanation: `The chapter centers on outlining the essential concepts and fundamental structures.`,
              questionType: 'MCQ' as const,
            },
            {
              question: `True or False: The principles taught in this chapter are highly applicable to practical real-world problems.`,
              options: ['True', 'False'],
              correctOption: 'True',
              explanation: `Every instructional unit is backed by solid industry application guidelines.`,
              questionType: 'TF' as const,
            },
          ];

          for (const q of fallbackQuizzes) {
            db.createQuiz({
              chapter_id: dbChapter.id,
              question: q.question,
              options: q.options,
              correct_option: q.correctOption,
              explanation: q.explanation,
              question_type: q.questionType,
            });
          }
        }
      });

      quizPromises.push(quizPromise);
    }

    // Wait for everything to complete
    await Promise.all([...lessonPromises, ...quizPromises]);

    console.log(`[EduCraft AI] E-Course ${dbCourse.title} generated successfully!`);
    return res.status(200).json({ course_id: dbCourse.id });
  } catch (error: any) {
    console.error('Course generation failed:', error);
    return res.status(500).json({ error: error.message || 'Course generation failed.' });
  }
});

// POST /api/progress/toggle
// Accept lesson_id and is_completed (boolean). Update the user_progress table.
app.post('/api/progress/toggle', (req, res) => {
  try {
    const { lesson_id, is_completed } = req.body;
    const userId = req.body.userId || 'default-user-id';

    if (!lesson_id) {
      return res.status(400).json({ error: 'Lesson ID is required.' });
    }

    const progress = db.toggleLessonProgress(userId, lesson_id, !!is_completed);
    return res.status(200).json(progress);
  } catch (error: any) {
    console.error('Toggle progress error:', error);
    return res.status(500).json({ error: 'Failed to update progress.' });
  }
});

// GET /api/quizzes/{chapter_id}
// Pull generated quiz configurations from the database
app.get('/api/quizzes/:chapter_id', (req, res) => {
  try {
    const chapterId = req.params.chapter_id;
    const quizzes = db.getQuizzesByChapter(chapterId);
    return res.status(200).json(quizzes);
  } catch (error: any) {
    console.error('Get quizzes error:', error);
    return res.status(500).json({ error: 'Failed to load quizzes.' });
  }
});

// POST /api/quizzes/submit
// Score user quiz inputs, save attempts, and return scored metrics with explanations
app.post('/api/quizzes/submit', (req, res) => {
  try {
    const { chapter_id, answers } = req.body; // answers: { [quizId]: selectedOption }
    const userId = req.body.userId || 'default-user-id';

    if (!chapter_id || !answers) {
      return res.status(400).json({ error: 'Chapter ID and answers object are required.' });
    }

    const quizzes = db.getQuizzesByChapter(chapter_id);
    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'No quiz questions exist for this chapter.' });
    }

    let score = 0;
    const details = quizzes.map((q) => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer?.trim().toLowerCase() === q.correct_option.trim().toLowerCase();
      if (isCorrect) score++;

      return {
        quiz_id: q.id,
        question: q.question,
        user_answer: userAnswer || 'Unanswered',
        correct_answer: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation,
      };
    });

    const attempt = db.createQuizAttempt({
      user_id: userId,
      chapter_id,
      score,
      total_questions: quizzes.length,
    });

    return res.status(200).json({
      attempt_id: attempt.id,
      score,
      total_questions: quizzes.length,
      percentage: Math.round((score / quizzes.length) * 100),
      questions: details,
    });
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    return res.status(500).json({ error: 'Failed to grade quiz submissions.' });
  }
});

// POST /api/chat/message
// Accepts prompt & course_id, performs semantic search, prompts Gemini with context limits, saves chat history
app.post('/api/chat/message', async (req, res) => {
  try {
    const { prompt, course_id } = req.body;
    const userId = req.body.userId || 'default-user-id';

    if (!prompt || !course_id) {
      return res.status(400).json({ error: 'Prompt and Course ID are required.' });
    }

    // Retrieve course context using simple RAG search
    const contextMaterial = db.retrieveCourseContext(course_id, prompt);

    // Save user's question to chat history
    db.addChatMessage({
      user_id: userId,
      course_id,
      sender: 'user',
      message: prompt,
    });

    const ai = getGeminiClient();

    console.log('[EduCraft AI] Prompting chatbot with course context...');
    const chatbotResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are the friendly, professional AI E-Learning companion for the course 'EduCraft AI'. Your goal is to guide students, explain technical definitions, simplify complex terms, and summarize chapter themes.

Use the retrieved course materials below as your source context boundaries. If a user asks a question unrelated to the course or the context materials, try to guide them back to course concepts gracefully. Give structured, helpful markdown answers with concise bullet points.

RELEVANT STUDY SOURCE MATERIAL:
${contextMaterial}

USER QUESTION:
${prompt}`,
    });

    const aiMessage = chatbotResponse.text || 'I encountered an issue generating a response. Please rephrase your query.';

    // Save AI's response to history
    db.addChatMessage({
      user_id: userId,
      course_id,
      sender: 'ai',
      message: aiMessage,
    });

    return res.status(200).json({ response: aiMessage });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Companion chatbot failure.' });
  }
});

// GET /api/chat/history
app.get('/api/chat/history', (req, res) => {
  try {
    const { course_id } = req.query;
    const userId = (req.query.userId as string) || 'default-user-id';

    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required.' });
    }

    const history = db.getChatHistory(userId, course_id as string);
    return res.status(200).json(history);
  } catch (error: any) {
    console.error('Chat history error:', error);
    return res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
});

// GET /api/search
// Handles fuzzy global search across cached modules
app.get('/api/search', (req, res) => {
  try {
    const { q } = req.query;
    const userId = (req.query.userId as string) || 'default-user-id';

    const results = db.globalSearch(userId, q as string);
    return res.status(200).json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed.' });
  }
});

// -------------------------------------------------------------
// VITE AND DEVELOPMENT DEV SERVER SETUP
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EduCraft AI Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
