// users.ts (or employees.ts)
import pool from "./db";

// Auth / basic user
export type Role = "admin" | "employee" | "teamLead";

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
};

// Full employee profile
export type Employee = {
  id: number;
  code: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  password: string;
  role: Role;
  department: string;
  location: string;
  shift: "day" | "evening" | "night";

  // Details
  address: string;
  city: string;
  stateRegion: string;
  country: string;
  zip: string;
  phone: string;
  hireDate: string;
  terminationDate?: string;

  // Billing
  workType: "standard" | "overtime";
  billingType: "hourly" | "monthly";
  employeeRate: string;
  employeeCurrency: string;
  billingRateType: "fixed" | "hourly";
  billingCurrency: string;
  billingStart: string;
  billingEnd: string;
  avatarUrl?: string;
  emailNotifications?: boolean;
  weeklyReport?: boolean;
  securityAlerts?: boolean;
};

export async function getUsers(): Promise<User[]> {
  const result = await pool.query('SELECT * FROM "Employee"');
  return result.rows.map(emp => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    password: emp.password,
    role: emp.role as Role,
  }));
}

export async function getEmployees(): Promise<Employee[]> {
  const result = await pool.query('SELECT * FROM "Employee"');
  return result.rows as Employee[];
}

export async function createEmployee(data: Omit<Employee, "id">): Promise<Employee> {
  const fields = Object.keys(data).map(key => `"${key}"`);
  // Convert empty strings to null to avoid Postgres type casting errors (e.g. for dates or numbers)
  const values = Object.values(data).map(v => v === "" ? null : v);
  const placeholders = values.map((_, i) => `$${i + 1}`);

  const queryStr = `INSERT INTO "Employee" (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  console.log("SQL QUERY:", queryStr);
  console.log("VALUES:", values);

  const result = await pool.query(queryStr, values);
  return result.rows[0];
}

export async function updateEmployeeProfile(id: number, data: Partial<Employee>): Promise<Employee> {
  const updates = Object.keys(data).map((key, i) => `"${key}" = $${i + 2}`);
  // Convert empty strings to null
  const values = [id, ...Object.values(data).map(v => v === "" ? null : v)];

  const result = await pool.query(
    `UPDATE "Employee" SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteEmployee(id: number): Promise<void> {
  await pool.query('DELETE FROM "Employee" WHERE id = $1', [id]);
}

// Temporary exports removed as all components are now updated to use server actions
