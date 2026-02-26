import pool from "./db";

export type EmployeeStatus = 'Active' | 'Inactive';

export type Employee = {
  id: number;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  department: string;
  location: string;
  code: string;
  status: EmployeeStatus;
  role: string;
  shift: string;
  address: string;
  city: string;
  stateRegion: string;
  country: string;
  zip: string;
  phone: string;
  hireDate: string;
  terminationDate?: string;
  workType: string;
  billingType: string;
  employeeRate: string;
  employeeCurrency: string;
  billingRateType: string;
  billingCurrency: string;
  billingStart: string;
  billingEnd?: string;
};

export async function getAdminEmployees(): Promise<Employee[]> {
  const result = await pool.query('SELECT * FROM "Employee"');
  const employees = result.rows;
  return employees.map((emp) => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`,
    firstName: emp.firstName,
    middleName: emp.middleName || undefined,
    lastName: emp.lastName,
    email: emp.email,
    department: emp.department,
    location: emp.location,
    code: emp.code,
    status: 'Active' as const,
    role: emp.role,
    shift: emp.shift,
    address: emp.address,
    city: emp.city,
    stateRegion: emp.stateRegion,
    country: emp.country,
    zip: emp.zip,
    phone: emp.phone,
    hireDate: emp.hireDate,
    terminationDate: emp.terminationDate || undefined,
    workType: emp.workType,
    billingType: emp.billingType,
    employeeRate: emp.employeeRate,
    employeeCurrency: emp.employeeCurrency,
    billingRateType: emp.billingRateType,
    billingCurrency: emp.billingCurrency,
    billingStart: emp.billingStart,
    billingEnd: emp.billingEnd || undefined,
  }));
}

// initialEmployees export removed, use fetchAdminEmployeesAction instead
