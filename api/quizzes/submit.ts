import { db } from '../_db.js';

export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const userId = (req.query?.userId as string) || 'default-user-id';
      const chapterId = req.query?.chapterId as string;
      const attempts = db.getQuizAttempts(userId, chapterId);
      return res.status(200).json(attempts);
    } catch (error: any) {
      console.error('Get quiz attempts error:', error);
      return res.status(500).json({ error: 'Failed to retrieve quiz attempts.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { chapter_id, answers } = body;
      const userId = body.userId || (req.query?.userId as string) || 'default-user-id';

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
        const isCorrect = userAnswer && q.correct_option && userAnswer.trim().toLowerCase() === q.correct_option.trim().toLowerCase();
        if (isCorrect) score++;

        return {
          quiz_id: q.id,
          question: q.question,
          user_answer: userAnswer || 'Unanswered',
          correct_answer: q.correct_option,
          is_correct: !!isCorrect,
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
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
