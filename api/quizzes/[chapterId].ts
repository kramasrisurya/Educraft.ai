import { db } from '../../src/db/db.ts';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chapterId = (req.query?.chapterId as string) || '';
    if (!chapterId) {
      return res.status(400).json({ error: 'Chapter ID is required.' });
    }

    const quizzes = db.getQuizzesByChapter(chapterId);
    return res.status(200).json(quizzes);
  } catch (error: any) {
    console.error('Get quizzes error:', error);
    return res.status(500).json({ error: 'Failed to load quizzes.' });
  }
}
