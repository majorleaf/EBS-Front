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
