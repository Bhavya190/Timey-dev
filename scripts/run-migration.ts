import pool from "../src/lib/db";

async function main() {
    console.log("Running DB migration...");
    try {
        await pool.query(`ALTER TABLE "Timesheet" ADD COLUMN IF NOT EXISTS "rejectionComment" TEXT;`);
        console.log("Added rejectionComment to Timesheet if not exists.");

        const checkNotification = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'Notification'
            );
        `);

        if (!checkNotification.rows[0].exists) {
            console.log("Creating Notification table...");
            await pool.query(`
            CREATE TABLE "Notification" (
                "id" SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                "message" TEXT NOT NULL,
                "isRead" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            `);
        } else {
            console.log("Notification table already exists.");
        }
        console.log("Migration complete!");
    } catch (err) {
        console.error("Error migrating:", err);
    } finally {
        await pool.end();
    }
}

main();
