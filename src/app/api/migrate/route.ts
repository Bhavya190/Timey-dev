import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    console.log("Running DB migration via API...");
    try {
        await pool.query(`ALTER TABLE "Timesheet" ADD COLUMN IF NOT EXISTS "rejectionComment" TEXT;`);

        const checkNotification = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'Notification'
            );
        `);

        if (!checkNotification.rows[0].exists) {
            await pool.query(`
            CREATE TABLE "Notification" (
                "id" SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                "message" TEXT NOT NULL,
                "isRead" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            `);
        }
        return NextResponse.json({ success: true, url: process.env.DATABASE_URL });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message, url: process.env.DATABASE_URL });
    }
}
