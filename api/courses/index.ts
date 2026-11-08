import { db } from '../../src/db/db.ts';

export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const userId = (req.query?.userId as string) || 'default-user-id';
      const courses = db.getCourses(userId);
      return res.status(200).json(courses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({ error: 'Failed to retrieve courses.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
