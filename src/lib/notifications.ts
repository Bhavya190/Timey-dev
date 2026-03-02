import pool from "./db";
import type { Notification } from "@/types";

export async function getNotifications(userId: number): Promise<Notification[]> {
    const result = await pool.query(
        'SELECT * FROM "Notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
        [userId]
    );
    return result.rows;
}

export async function addNotification(userId: number, message: string): Promise<Notification> {
    const result = await pool.query(
        'INSERT INTO "Notification" ("userId", "message") VALUES ($1, $2) RETURNING *',
        [userId, message]
    );
    return result.rows[0];
}

export async function markNotificationRead(id: number): Promise<Notification> {
    const result = await pool.query(
        'UPDATE "Notification" SET "isRead" = true WHERE "id" = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
}

export async function getAdminUserIds(): Promise<number[]> {
    // Returns IDs of all users with role 'admin' or 'teamLead'
    const result = await pool.query(
        'SELECT id FROM "Employee" WHERE "role" IN ($1, $2)',
        ['admin', 'teamLead']
    );
    return result.rows.map((row) => row.id);
}
