import pool from "./db";

export type DailyTimeStatus = "Not Started" | "Clocked In" | "Paused" | "Clocked Out";

export type DailyTime = {
    id: number;
    employeeId: number;
    date: string;
    status: DailyTimeStatus;
    totalSeconds: number;
    lastClockInTime: string | null;
};

// Helper to sanitize dates for Next.js actions
function formatRow(row: any): DailyTime {
    return {
        ...row,
        lastClockInTime: row.lastClockInTime ? new Date(row.lastClockInTime).toISOString() : null
    };
}

export async function getDailyTime(employeeId: number, date: string): Promise<DailyTime | null> {
    const res = await pool.query('SELECT * FROM "DailyTime" WHERE "employeeId" = $1 AND "date" = $2', [employeeId, date]);
    if (res.rows.length === 0) return null;
    return formatRow(res.rows[0]);
}

export async function clockIn(employeeId: number, date: string): Promise<DailyTime> {
    const existing = await getDailyTime(employeeId, date);
    
    if (!existing) {
        const res = await pool.query(
            `INSERT INTO "DailyTime" ("employeeId", "date", "status", "lastClockInTime") 
             VALUES ($1, $2, 'Clocked In', CURRENT_TIMESTAMP) RETURNING *`,
            [employeeId, date]
        );
        return formatRow(res.rows[0]);
    }

    if (existing.status === "Clocked Out") {
        throw new Error("Already clocked out for the day.");
    }

    if (existing.status !== "Clocked In") {
        const res = await pool.query(
            `UPDATE "DailyTime" SET "status" = 'Clocked In', "lastClockInTime" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = $1 RETURNING *`,
            [existing.id]
        );
        return formatRow(res.rows[0]);
    }
    return existing;
}

export async function pauseTime(employeeId: number, date: string): Promise<DailyTime> {
    const existing = await getDailyTime(employeeId, date);
    if (!existing) throw new Error("No time record found.");
    if (existing.status !== "Clocked In") return existing; 

    // Calculate elapsed time correctly in Postgres and add to totalSeconds
    const res = await pool.query(
        `UPDATE "DailyTime" 
         SET "status" = 'Paused', 
             "totalSeconds" = "totalSeconds" + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "lastClockInTime"))::integer,
             "lastClockInTime" = NULL,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [existing.id]
    );
    return formatRow(res.rows[0]);
}

export async function clockOut(employeeId: number, date: string): Promise<DailyTime> {
    const existing = await getDailyTime(employeeId, date);
    if (!existing) {
         // Create a zero-hour Clocked Out record if they somehow clock out without clocking in
         const res = await pool.query(
            `INSERT INTO "DailyTime" ("employeeId", "date", "status", "totalSeconds") 
             VALUES ($1, $2, 'Clocked Out', 0) RETURNING *`,
            [employeeId, date]
        );
        return formatRow(res.rows[0]);
    }
    if (existing.status === "Clocked Out") return existing;
    
    let query = `UPDATE "DailyTime" SET "status" = 'Clocked Out', "lastClockInTime" = NULL, "updatedAt" = CURRENT_TIMESTAMP`;
    if (existing.status === "Clocked In") {
        query = `UPDATE "DailyTime" SET "status" = 'Clocked Out', 
                 "totalSeconds" = "totalSeconds" + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - "lastClockInTime"))::integer,
                 "lastClockInTime" = NULL, "updatedAt" = CURRENT_TIMESTAMP`;
    }

    const res = await pool.query(`${query} WHERE id = $1 RETURNING *`, [existing.id]);
    return formatRow(res.rows[0]);
}
