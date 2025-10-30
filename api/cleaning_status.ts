import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT r.room_number, cs.status
        FROM cleaning_statuses cs
        JOIN rooms r ON cs.room_id = r.room_id;
      `;
      const statusMap = rows.reduce((acc, row) => {
        acc[row.room_number] = row.status;
        return acc;
      }, {});
      return res.status(200).json(statusMap);
    }

    if (req.method === 'PUT') {
      const { roomId, status } = req.body;
      if (!roomId || !status) {
        return res.status(400).json({ error: 'Room ID and status are required' });
      }

      await sql`
        UPDATE cleaning_statuses
        SET status = ${status}, last_updated = CURRENT_TIMESTAMP
        WHERE room_id = (SELECT room_id FROM rooms WHERE room_number = ${roomId});
      `;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
