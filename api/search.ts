import { db } from '../src/db/db.ts';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const q = (req.query?.q as string) || '';
    const userId = (req.query?.userId as string) || 'default-user-id';

    const results = db.globalSearch(userId, q);
    return res.status(200).json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed.' });
  }
}
