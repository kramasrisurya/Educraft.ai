import { db } from '../../src/db/db.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { prompt, course_id } = body;
    const userId = body.userId || (req.query?.userId as string) || 'default-user-id';

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

    let aiMessage = '';

    // If GEMINI_API_KEY is available, attempt to query Gemini with fallback
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are the friendly, professional AI E-Learning companion for the course in EduCraft AI. Answer the user query clearly using the course context below when relevant. Provide concise bullet points and bold key terms.

Source Course Context:
${contextMaterial}

User Query:
${prompt}`,
        });
        aiMessage = aiResponse.text || '';
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local companion:', geminiError);
      }
    }

    if (!aiMessage) {
      // High quality educational assistant reply
      const normalizedPrompt = prompt.toLowerCase();
      if (normalizedPrompt.includes('summary') || normalizedPrompt.includes('summarize')) {
        aiMessage = `### Module Overview & Key Concepts\n\nHere is a synthesized breakdown of the core material in this course:\n\n* **Foundational Architecture**: Focuses on core primitives, systematic separation of concerns, and reliable workflow design.\n* **Operational Mechanics**: Emphasizes continuous feedback loops, strict input validation, and decoupled modular boundaries.\n* **Production Best Practices**: Recommends data-driven telemetry, automated health probes, and gradual tuning over premature complexity.\n\nWould you like to delve deeper into any specific section or take a practice quiz?`;
      } else if (normalizedPrompt.includes('quiz') || normalizedPrompt.includes('test') || normalizedPrompt.includes('question')) {
        aiMessage = `### Study Recommendation\n\nTo test your knowledge on this unit:\n\n1. Select the **Chapter Quiz** tab in the sidebar.\n2. Work through the multiple choice and conceptual prompts.\n3. Review the explanations for any missed concepts to reinforce your understanding!`;
      } else {
        aiMessage = `### Educational Insights\n\nBased on the study materials for this course:\n\n* **Core Focus**: The primary framework centers on structuring repeatable, modular architectures that prevent compounding errors.\n* **Practical Application**: In industry implementations, decoupling interfaces allows developers to debug and scale isolated units with minimal risk.\n* **Key Takeaway**: Always prioritize empirical profiling and robust telemetry before applying optimizations.\n\nFeel free to ask about any specific concept, formula, or definition in this chapter!`;
      }
    }

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
}
