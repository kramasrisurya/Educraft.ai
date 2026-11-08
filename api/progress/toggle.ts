import { db } from '../_db.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { lesson_id, is_completed } = body;
    const userId = body.userId || (req.query?.userId as string) || 'default-user-id';

    if (!lesson_id) {
      return res.status(400).json({ error: 'Lesson ID is required.' });
    }

    const progress = db.toggleLessonProgress(userId, lesson_id, !!is_completed);
    return res.status(200).json(progress);
  } catch (error: any) {
    console.error('Toggle progress error:', error);
    return res.status(500).json({ error: 'Failed to update progress.' });
  }
}
