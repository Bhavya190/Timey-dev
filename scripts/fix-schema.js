require('dotenv').config();
const { Pool } = require('pg');

async function fixDB() {
    // The user's production Render database URL from their logs
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("Missing DATABASE_URL");
        return;
    }

    const pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log("Adding missing columns to Employee table...");

        const queries = [
            `ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "middleName" TEXT;`,
            `ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "terminationDate" TEXT;`,
            `ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN DEFAULT false;`,
            `ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "weeklyReport" BOOLEAN DEFAULT false;`,
            `ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "securityAlerts" BOOLEAN DEFAULT false;`
        ];

        for (const query of queries) {
            console.log(`Executing: ${query}`);
            await pool.query(query);
            console.log("Success.");
        }

        console.log("All missing columns added successfully!");

    } catch (err) {
        console.error("Error updating schema:", err);
    } finally {
        await pool.end();
    }
}

fixDB();
