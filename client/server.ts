import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool ({
    connectionString: process.env.DATABASE_URL,
    ssl: {rejectUnauthorized: false }
});

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20"
});


app.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ 
            status: 'success',
            message: 'Connected to Supabase',
            time: result.rows[0].current_time
        });
    } catch(error) {
        console.error(error, 'Database connection error:');
        res.status(500).json({ status: 'error', message: 'Failed to connect database'});
    }
});

  //POST /api/bookings/lock  concurrency control
  app.post('/api/bookings/lock', async (req, res) => {
    const { event_id, user_id, num_tickets } = req.body;

    if (!event_id || !user_id || !num_tickets || num_tickets < 1) {
        return res.status(400).json({ error: 'event_id, user_id and num_tickets are required' })
    }

    const client = await pool.connect();

    try { 
        await client.query('BEGIN');
        
        //Lock the event row itself thereby preventing any other transaction from  reading/reserving capacity on this event until we commit/rollback
        const eventQuery = `
        SELECT * FROM events
        WHERE id = $1
        FOR UPDATE;
        `;
        const { rows: eventRows } = await client.query(eventQuery, [event_id]);

        if (eventRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Event not found.'});
        }

        const event = eventRows[0];

        // Count seats that are already held by unexpired pending locks, overselling against holds that haven't converted to confirmed bookings yet
        const pendingQuery = `
        SELECT COALESCE(SUM(num_tickets), 0) AS held
        FROM bookings 
        WHERE bookings
        WHERE event_id = $1
        AND status = 'pending'
        AND locked_at > NOW() - INTERNAL '10 minutes';
        `;
        const { rows: pendingRows } = await client.query(pendingQuery, [event_id]);
        const held = Number(pendingRows[0].held);

        const trulyAvailable = event.available_seats - held;

        if (num_tickets > trulyAvailable) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'Not enough seats available.',
                available: trulyAvailable
            });
        }

        //Create the pending hold 
        const insertQuery = `
        INSERT INTO bookings (event_id, user_id, num_tickets, total_price, status, locked_at)
        VALUES ($1, $2, $3, $4, 'pending', NOW())
        RETURNING *;
        `;
        const totalPrice = event.price * num_tickets
        const { rows: bookingRows } = await client.query(insertQuery, [
            event_id, user_id, num_tickets, totalPrice
        ]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Seats held for 10 minutes.',
            booking: bookingRows[0]
        })
 

    } catch(error) {
        await client.query('ROLLBACK');
        console.error(error)
    } finally {
        client.release();
    }
  })

  const PORT = process.env.PORT || 8000;
  
  app.listen(PORT, () => {
    console.log(`EBS backend running on ${PORT}`);
  })