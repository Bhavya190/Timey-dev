import pool from "./db";
import type { Timesheet } from "@/types";

export async function getTimesheets(): Promise<Timesheet[]> {
  const result = await pool.query('SELECT * FROM "Timesheet"');
  const timesheets = result.rows;
  return timesheets.map(ts => ({
    ...ts,
    status: ts.status || "Not Submitted"
  }));
}

export async function getEmployeeTimesheets(employeeId: number): Promise<Timesheet[]> {
  const result = await pool.query('SELECT * FROM "Timesheet" WHERE "employeeId" = $1', [employeeId]);
  const timesheets = result.rows;
  return timesheets.map(ts => ({
    ...ts,
    status: ts.status || "Not Submitted"
  }));
}

export async function upsertTimesheet(data: Omit<Timesheet, "id">): Promise<Timesheet> {
  const { employeeId, weekStart, status } = data;

  // Try to find existing
  const existingResult = await pool.query(
    'SELECT * FROM "Timesheet" WHERE "employeeId" = $1 AND "weekStart" = $2',
    [employeeId, weekStart]
  );
  const existing = existingResult.rows;

  if (existing.length > 0) {
    const updatedResult = await pool.query(
      'UPDATE "Timesheet" SET "status" = $1 WHERE "id" = $2 RETURNING *',
      [status, existing[0].id]
    );
    return updatedResult.rows[0];
  } else {
    const createdResult = await pool.query(
      'INSERT INTO "Timesheet" ("employeeId", "weekStart", "status") VALUES ($1, $2, $3) RETURNING *',
      [employeeId, weekStart, status]
    );
    return createdResult.rows[0];
  }
}
