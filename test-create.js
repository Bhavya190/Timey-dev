// Wait, lib/users.ts requires ts-node to execute cleanly.
const { execSync } = require('child_process');

try {
    // Let's just create a quick direct pg script to simulate the exact payload
    const { Pool } = require('pg');
    require('dotenv').config();
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    async function test() {
        const data = {
            firstName: "Test",
            lastName: "User",
            email: "test_new@timey.com",
            password: "hashedpwd123",
            role: "employee",
            department: "Management",
            location: "Remote",
            code: "TMP-001",
            shift: "day",
            address: "123",
            city: "City",
            stateRegion: "ST",
            country: "USA",
            zip: "11111",
            phone: "555-0000",
            workType: "standard",
            billingType: "hourly",
            employeeRate: "100",
            employeeCurrency: "USD",
            billingRateType: "hourly",
            billingCurrency: "USD",
            billingStart: "2023-01-01"
        }

        const fields = Object.keys(data).map(key => `"${key}"`);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const queryStr = `INSERT INTO "Employee" (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
        console.log("SQL QUERY:", queryStr);

        try {
            const result = await pool.query(queryStr, values);
            console.log("SUCCESS:", result.rows[0]);
        } catch (err) {
            console.error("PG ERROR:", err);
        }
        pool.end();
    }

    test();
} catch (err) {
    console.error("Setup error", err);
}
