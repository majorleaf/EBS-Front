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

        // Count seats that are already held by unexpired pending locks, overselling against holds that haven't 

    } catch(error) {
        await client.query('ROLLBACK');
        console.error(error)
    } finally {
        client.release();
    }
  })