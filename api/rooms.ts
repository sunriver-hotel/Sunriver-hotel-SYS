import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { rows } = await sql`
      SELECT 
        room_number as id,
        room_type as type,
        bed_type as bed,
        floor
      FROM rooms;
    `;
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
