import { db } from '../../src/db/db.ts';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const courseId = (req.query?.course_id as string) || '';
    const userId = (req.query?.userId as string) || 'default-user-id';

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required.' });
    }

    const history = db.getChatHistory(userId, courseId);
    return res.status(200).json(history);
  } catch (error: any) {
    console.error('Chat history error:', error);
    return res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
}
