import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Self-contained helper to format dd/mm/yyyy to yyyy-mm-dd for PostgreSQL
const formatDateForDB = (dateString: string): string => {
    if (!dateString || dateString.split('/').length !== 3) {
        // Return a value that will likely cause a DB error, which is better than silent failure
        return 'invalid-date';
    }
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT 
          b.booking_id as id,
          b.created_at as timestamp,
          c.customer_name as "customerName",
          c.phone,
          TO_CHAR(b.check_in_date, 'DD/MM/YYYY') as "checkIn",
          TO_CHAR(b.check_out_date, 'DD/MM/YYYY') as "checkOut",
          b.payment_status as "paymentStatus",
          b.deposit_amount as "depositAmount",
          c.email,
          c.address,
          c.tax_id as "taxId",
          b.price_per_night as "pricePerNight",
          ARRAY_AGG(r.room_number) as "roomIds"
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN booking_rooms br ON b.booking_id = br.booking_id
        JOIN rooms r ON br.room_id = r.room_id
        GROUP BY b.booking_id, c.customer_id
        ORDER BY b.created_at DESC;
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
        const { id, customerName, phone, email, address, taxId, roomIds, checkIn, checkOut, paymentStatus, pricePerNight, depositAmount } = req.body;

        if (!customerName || !phone || !checkIn || !checkOut || !roomIds || roomIds.length === 0) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const client = await sql.connect();
        try {
            await client.query('BEGIN');

            let customerId;
            const existingCustomer = await client.query('SELECT customer_id FROM customers WHERE customer_name = $1 AND phone = $2', [customerName, phone]);
            
            if (existingCustomer.rows.length > 0) {
                customerId = existingCustomer.rows[0].customer_id;
                await client.query(
                    'UPDATE customers SET email = $1, address = $2, tax_id = $3 WHERE customer_id = $4',
                    [email, address, taxId, customerId]
                );
            } else {
                const newCustomer = await client.query(
                    'INSERT INTO customers (customer_name, phone, email, address, tax_id) VALUES ($1, $2, $3, $4, $5) RETURNING customer_id',
                    [customerName, phone, email, address, taxId]
                );
                customerId = newCustomer.rows[0].customer_id;
            }
            
            const dbCheckIn = formatDateForDB(checkIn);
            const dbCheckOut = formatDateForDB(checkOut);

            if (req.method === 'POST') {
                const bookingId = req.body.id;
                 await client.query(
                    'INSERT INTO bookings (booking_id, customer_id, check_in_date, check_out_date, payment_status, price_per_night, deposit_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [bookingId, customerId, dbCheckIn, dbCheckOut, paymentStatus, pricePerNight, depositAmount]
                );
                for (const roomNumber of roomIds) {
                    const room = await client.query('SELECT room_id FROM rooms WHERE room_number = $1', [roomNumber]);
                    if (room.rows.length > 0) {
                        await client.query('INSERT INTO booking_rooms (booking_id, room_id) VALUES ($1, $2)', [bookingId, room.rows[0].room_id]);
                    }
                }
            } else { // PUT
                 await client.query(
                    'UPDATE bookings SET customer_id = $1, check_in_date = $2, check_out_date = $3, payment_status = $4, price_per_night = $5, deposit_amount = $6 WHERE booking_id = $7',
                    [customerId, dbCheckIn, dbCheckOut, paymentStatus, pricePerNight, depositAmount, id]
                );
                await client.query('DELETE FROM booking_rooms WHERE booking_id = $1', [id]);
                for (const roomNumber of roomIds) {
                    const room = await client.query('SELECT room_id FROM rooms WHERE room_number = $1', [roomNumber]);
                    if (room.rows.length > 0) {
                        await client.query('INSERT INTO booking_rooms (booking_id, room_id) VALUES ($1, $2)', [id, room.rows[0].room_id]);
                    }
                }
            }

            await client.query('COMMIT');
            client.release();
            return res.status(200).json({ success: true });

        } catch (e) {
            await client.query('ROLLBACK');
            client.release();
            throw e;
        }
    }
    
    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}