import pool from "./db";
import { Department } from "@/types";

export async function getDepartments(): Promise<Department[]> {
    const result = await pool.query(`
        SELECT d.*, COUNT(e.id)::int as "employeeCount"
        FROM "Department" d
        LEFT JOIN "Employee" e ON d.id = e."departmentId"
        GROUP BY d.id
        ORDER BY d.name ASC
    `);
    return result.rows;
}

export async function getDepartmentById(id: number): Promise<Department | null> {
    const result = await pool.query('SELECT * FROM "Department" WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
}

export async function createDepartment(data: { name: string; description?: string }): Promise<Department> {
    const result = await pool.query(
        'INSERT INTO "Department" (name, description) VALUES ($1, $2) RETURNING *',
        [data.name, data.description || null]
    );
    return result.rows[0];
}

export async function updateDepartment(id: number, data: { name: string; description?: string }): Promise<Department> {
    const result = await pool.query(
        'UPDATE "Department" SET name = $1, description = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [data.name, data.description || null, id]
    );
    return result.rows[0];
}

export async function deleteDepartment(id: number): Promise<void> {
    await pool.query('DELETE FROM "Department" WHERE id = $1', [id]);
}

export async function getDepartmentEmployees(departmentId: number) {
    const result = await pool.query('SELECT id, firstName, lastName, email, role, code FROM "Employee" WHERE "departmentId" = $1', [departmentId]);
    return result.rows;
}
