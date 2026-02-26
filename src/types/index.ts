export type Role = "admin" | "employee" | "teamLead";

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: Role;
}

export type EmployeeStatus = 'Active' | 'Inactive';

export interface Employee {
    id: number;
    name?: string; // Optional: Often computed or only in certain views
    code: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    password: string;
    role: Role;
    department: string;
    location: string;
    status?: EmployeeStatus; // Optional: Missing in lib/users.ts but present in lib/employees.ts
    shift: "day" | "evening" | "night";
    address: string;
    city: string;
    stateRegion: string;
    country: string;
    zip: string;
    phone: string;
    hireDate: string;
    terminationDate?: string;
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
}

export type EmployeeProfile = Employee;

export type ClientStatus = "Active" | "Inactive";

export interface Client {
    id: number;
    name: string;
    nickname?: string;
    email: string;
    country: string;
    address?: string;
    city?: string;
    stateRegion?: string;
    zip?: string;
    contactNumber?: string;
    defaultRate?: string;
    fixedBidMode: boolean;
    status: ClientStatus;
}

export type ProjectStatus = "Active" | "On Hold" | "Completed";

export interface Project {
    id: number;
    name: string;
    code: string;
    clientId: number;
    clientName: string;
    teamLeadId: number | null;
    managerId: number | null;
    teamMemberIds?: number[];
    defaultBillingRate?: string;
    billingType?: "fixed" | "hourly";
    fixedCost?: string;
    startDate?: string;
    endDate?: string;
    budget?: string;
    totalHours?: number;
    invoiceFileName?: string;
    description?: string;
    duration?: string;
    estimatedCost?: string;
    status: ProjectStatus;
}

export type TaskStatus = "Not Started" | "In Progress" | "Completed";
export type TaskBillingType = "billable" | "non-billable";

export interface Task {
    id: number;
    projectId: number;
    projectName: string;
    name: string;
    workedHours: number;
    assigneeIds: number[];
    date: string; // YYYY-MM-DD
    dueDate?: string;   // YYYY-MM-DD
    reportedTo?: string;
    status: TaskStatus;
    description?: string;
    billingType: TaskBillingType;
}

export interface Timesheet {
    id: number;
    employeeId: number;
    weekStart: string; // ISO date string (Monday)
    status: string;    // "Not Submitted", "Submitted"
}
