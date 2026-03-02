import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log("DB connection successful! URL:", process.env.DATABASE_URL);
        return NextResponse.json({ success: true, url: process.env.DATABASE_URL, time: res.rows[0].now });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message, url: process.env.DATABASE_URL });
    }
}
