require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log('Starting raw DB initialization...');

    try {
        // Check if database is already initialized
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'Employee'
            );
        `);

        if (checkTable.rows[0].exists) {
            console.log("Database tables already exist. Skipping initialization.");
            return;
        }

        console.log('Creating tables...');

        // Employee
        await pool.query(`
      CREATE TABLE "Employee" (
          "id" SERIAL PRIMARY KEY,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'employee',
          "code" TEXT,
          "department" TEXT,
          "location" TEXT,
          "shift" TEXT DEFAULT 'N/A',
          "address" TEXT,
          "city" TEXT,
          "stateRegion" TEXT,
          "country" TEXT,
          "zip" TEXT,
          "phone" TEXT,
          "hireDate" TEXT,
          "workType" TEXT,
          "billingType" TEXT,
          "employeeRate" TEXT,
          "employeeCurrency" TEXT DEFAULT 'USD',
          "billingRateType" TEXT,
          "billingCurrency" TEXT DEFAULT 'USD',
          "billingStart" TEXT,
          "billingEnd" TEXT,
          "avatarUrl" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Client
        await pool.query(`
      CREATE TABLE "Client" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "nickname" TEXT,
          "email" TEXT,
          "country" TEXT,
          "status" TEXT NOT NULL DEFAULT 'Active',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Project
        await pool.query(`
      CREATE TABLE "Project" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "code" TEXT NOT NULL UNIQUE,
          "clientId" INTEGER NOT NULL REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          "clientName" TEXT NOT NULL,
          "teamLeadId" INTEGER REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          "managerId" INTEGER REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          "defaultBillingRate" TEXT,
          "billingType" TEXT,
          "fixedCost" TEXT,
          "startDate" TEXT,
          "endDate" TEXT,
          "invoiceFileName" TEXT,
          "description" TEXT,
          "duration" TEXT,
          "estimatedCost" TEXT,
          "status" TEXT NOT NULL DEFAULT 'Active',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Project _TeamMembers Relation (Many-to-Many)
        await pool.query(`
      CREATE TABLE "_TeamMembers" (
          "A" INTEGER NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "B" INTEGER NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX "_TeamMembers_AB_unique" ON "_TeamMembers"("A", "B");
      CREATE INDEX "_TeamMembers_B_index" ON "_TeamMembers"("B");
    `);

        // Task
        await pool.query(`
      CREATE TABLE "Task" (
          "id" SERIAL PRIMARY KEY,
          "projectId" INTEGER NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "projectName" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "workedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "startDate" TEXT NOT NULL,
          "dueDate" TEXT,
          "reportedTo" TEXT,
          "status" TEXT NOT NULL DEFAULT 'Not Started',
          "description" TEXT,
          "billingType" TEXT NOT NULL DEFAULT 'billable',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Task _AssigneeTasks Relation (Many-to-Many)
        await pool.query(`
      CREATE TABLE "_AssigneeTasks" (
          "A" INTEGER NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "B" INTEGER NOT NULL REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
      CREATE UNIQUE INDEX "_AssigneeTasks_AB_unique" ON "_AssigneeTasks"("A", "B");
      CREATE INDEX "_AssigneeTasks_B_index" ON "_AssigneeTasks"("B");
    `);

        // Timesheet
        await pool.query(`
      CREATE TABLE "Timesheet" (
          "id" SERIAL PRIMARY KEY,
          "employeeId" INTEGER NOT NULL REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          "weekStart" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'Not Submitted',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

        const salt = await bcrypt.genSalt(10);

        console.log('Seeding employees...');
        const employees = [
            {
                firstName: "John",
                lastName: "Manager",
                email: "admin@timey.com",
                password: "password123",
                role: "admin",
                code: "ADM-001",
                department: "Management",
                location: "Office",
                shift: "day",
                address: "123 Admin Lane",
                city: "Metropolis",
                stateRegion: "Central",
                country: "USA",
                zip: "10001",
                phone: "555-0100",
                hireDate: "2023-01-01",
                workType: "standard",
                billingType: "monthly",
                employeeRate: "5000",
                employeeCurrency: "USD",
                billingRateType: "fixed",
                billingCurrency: "USD",
                billingStart: "2023-01-01",
                billingEnd: "2025-12-31",
            },
            {
                firstName: "Sarah",
                lastName: "Lead",
                email: "sarah@timey.com",
                password: "password123",
                role: "teamLead",
                code: "TL-001",
                department: "Engineering",
                location: "Remote",
                shift: "day",
                address: "456 Lead St",
                city: "Innovate",
                stateRegion: "West",
                country: "USA",
                zip: "20002",
                phone: "555-0101",
                hireDate: "2023-02-15",
                workType: "standard",
                billingType: "hourly",
                employeeRate: "60",
                employeeCurrency: "USD",
                billingRateType: "hourly",
                billingCurrency: "USD",
                billingStart: "2023-02-15",
                billingEnd: "2025-12-31",
            },
            {
                firstName: "Mike",
                lastName: "Dev",
                email: "mike@timey.com",
                password: "password123",
                role: "employee",
                code: "EMP-001",
                department: "Engineering",
                location: "Remote",
                shift: "day",
                address: "789 Dev Rd",
                city: "Coders",
                stateRegion: "East",
                country: "USA",
                zip: "30003",
                phone: "555-0102",
                hireDate: "2023-03-20",
                workType: "standard",
                billingType: "hourly",
                employeeRate: "45",
                employeeCurrency: "USD",
                billingRateType: "hourly",
                billingCurrency: "USD",
                billingStart: "2023-03-20",
                billingEnd: "2025-12-31",
            }
        ];

        const empIds = [];
        for (const emp of employees) {
            const hashedPassword = await bcrypt.hash(emp.password, salt);
            const res = await pool.query(
                `INSERT INTO "Employee" ("firstName", "lastName", "email", "password", "role", "code", "department", "location", "shift", "address", "city", "stateRegion", "country", "zip", "phone", "hireDate", "workType", "billingType", "employeeRate", "employeeCurrency", "billingRateType", "billingCurrency", "billingStart", "billingEnd")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
           RETURNING id`,
                [emp.firstName, emp.lastName, emp.email, hashedPassword, emp.role, emp.code, emp.department, emp.location, emp.shift, emp.address, emp.city, emp.stateRegion, emp.country, emp.zip, emp.phone, emp.hireDate, emp.workType, emp.billingType, emp.employeeRate, emp.employeeCurrency, emp.billingRateType, emp.billingCurrency, emp.billingStart, emp.billingEnd]
            );
            empIds.push(res.rows[0].id);
        }
        const [adminId, leadId, devId] = empIds;

        console.log('Seeding clients...');
        const clientRes = await pool.query(
            `INSERT INTO "Client" ("name", "nickname", "email", "country", "status")
       VALUES ('Global Tech', 'GTech', 'contact@gtech.com', 'USA', 'Active'),
              ('Innovative Solutions', 'ISol', 'info@innovativesol.com', 'Canada', 'Active')
       RETURNING id`
        );
        const clientId = clientRes.rows[0].id;

        console.log('Seeding projects...');
        const projRes = await pool.query(
            `INSERT INTO "Project" ("name", "code", "clientId", "clientName", "teamLeadId", "managerId", "status", "startDate", "billingType", "defaultBillingRate")
       VALUES ('Cloud Migration', 'PRJ-CLOUD', $1, 'Global Tech', $2, $3, 'Active', '2024-01-01', 'hourly', '120')
       RETURNING id`,
            [clientId, leadId, adminId]
        );
        const projId = projRes.rows[0].id;

        // Add team members to project
        await pool.query('INSERT INTO "_TeamMembers" ("A", "B") VALUES ($1, $2), ($3, $4)', [leadId, projId, devId, projId]);

        console.log('Seeding tasks...');
        const taskRes = await pool.query(
            `INSERT INTO "Task" ("projectId", "projectName", "name", "workedHours", "startDate", "status", "billingType")
       VALUES ($1, 'Cloud Migration', 'Architecture Design', 40, '2024-01-15', 'Completed', 'billable')
       RETURNING id`,
            [projId]
        );
        const taskId = taskRes.rows[0].id;

        // Add assignees to task
        await pool.query('INSERT INTO "_AssigneeTasks" ("A", "B") VALUES ($1, $2), ($3, $4)', [leadId, taskId, devId, taskId]);

        console.log('Seeding finished successfully.');

    } catch (err) {
        console.error('Error during data initialization:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
