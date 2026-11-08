import { db } from '../../src/db/db.ts';

export default function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const courseId = (req.query?.id as string) || '';
      const userId = (req.query?.userId as string) || 'default-user-id';

      if (!courseId) {
        return res.status(400).json({ error: 'Course ID is required.' });
      }

      const hierarchy = db.getCourseHierarchy(courseId, userId);
      if (!hierarchy) {
        return res.status(404).json({ error: 'Course not found.' });
      }

      return res.status(200).json(hierarchy);
    } catch (error: any) {
      console.error('Error fetching course hierarchy:', error);
      return res.status(500).json({ error: 'Failed to retrieve course details.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
