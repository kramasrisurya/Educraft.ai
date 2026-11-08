export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = body.email;
    const fullName = body.full_name;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const name = fullName || email.split('@')[0];
    const user = {
      id: 'user-' + Buffer.from(email).toString('hex').slice(0, 12),
      email,
      full_name: name,
      created_at: new Date().toISOString(),
    };

    return res.status(200).json({
      token: `mock-supabase-jwt-for-${user.id}`,
      user,
    });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
