"use server"

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { signToken, verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

import type {
    User,
    Employee,
    EmployeeProfile,
    Client,
    Project,
    Task,
    Timesheet,
    Notification,
    Department
} from "@/types";

import {
    getUsers,
    getEmployees,
    createEmployee,
    updateEmployeeProfile,
    deleteEmployee
} from "@/lib/users";
import { getAdminEmployees } from "@/lib/employees";
import {
    getClients,
    createClient,
    updateClient,
    deleteClient
} from "@/lib/clients";
import {
    getProjects,
    createProject,
    updateProject,
    deleteProject
} from "@/lib/projects";
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} from "@/lib/tasks";
import {
    getTimesheets,
    getEmployeeTimesheets,
    upsertTimesheet,
    approveTimesheet,
    rejectTimesheet
} from "@/lib/timesheets";
import { sendInvitationEmail } from "@/lib/mail";
import {
    moveToTrash,
    getTrashForUser,
    getAllTrash,
    restoreFromTrash,
    hardDeleteTrash,
} from "@/lib/trash";
import {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from "@/lib/departments";

// Re-export types for convenience
export type { User, Employee, EmployeeProfile, Client, Project, Task, Timesheet };

export async function fetchUsersAction(): Promise<User[]> {
    return await getUsers();
}

export async function fetchEmployeesAction(): Promise<Employee[]> {
    return await getEmployees();
}

export async function fetchAdminEmployeesAction(): Promise<any[]> {
    return await getAdminEmployees();
}

export async function fetchClientsAction(): Promise<Client[]> {
    return await getClients();
}

export async function fetchProjectsAction(): Promise<Project[]> {
    return await getProjects();
}

export async function fetchTasksAction(): Promise<Task[]> {
    return await getTasks();
}

export async function fetchEmployeeAction(id: number): Promise<Employee | null> {
    console.log(`fetchEmployeeAction called with id: ${id} (type: ${typeof id})`);
    const employees = await getEmployees();
    const found = employees.find(e => e.id == id) || null;
    console.log(`fetchEmployeeAction found: ${found ? found.firstName + ' ' + found.lastName : 'null'}`);
    return found;
}

// Queries - Departments
export async function fetchDepartmentsAction(): Promise<Department[]> {
    return await getDepartments();
}
export async function fetchDepartmentByIdAction(id: number): Promise<Department | null> {
    return await getDepartmentById(id);
}

// Mutations - Clients
export async function createClientAction(data: Omit<Client, "id">) {
    try {
        return await createClient(data);
    } catch (err: any) {
        console.error("createClientAction error:", err);
        return { error: err.message || "Failed to create client in database" };
    }
}
export async function updateClientAction(id: number, data: Partial<Client>) {
    try {
        return await updateClient(id, data);
    } catch (err: any) {
        console.error("updateClientAction error:", err);
        return { error: err.message || "Failed to update client in database" };
    }
}
export async function deleteClientAction(id: number) {
    try {
        const clients = await getClients();
        const client = clients.find(c => c.id === id);
        if (client) {
            const user = await getCurrentUserAction();
            if (user) await moveToTrash(user.id, "Client", id, client);
        }
        await deleteClient(id);
        return { success: true };
    } catch (err: any) {
        console.error("deleteClientAction error:", err);
        return { error: err.message || "Failed to delete client in database" };
    }
}

// Mutations - Projects
export async function createProjectAction(data: Omit<Project, "id">) {
    return await createProject(data);
}
export async function updateProjectAction(id: number, data: Partial<Project>) {
    return await updateProject(id, data);
}
export async function deleteProjectAction(id: number) {
    const projects = await getProjects();
    const proj = projects.find(p => p.id === id);
    if (proj) {
        const user = await getCurrentUserAction();
        if (user) await moveToTrash(user.id, "Project", id, proj);
    }
    return await deleteProject(id);
}

// Mutations - Departments
export async function createDepartmentAction(data: { name: string; description?: string }) {
    try {
        const result = await createDepartment(data);
        revalidatePath("/admin/departments");
        return result;
    } catch (err: any) {
        console.error("createDepartmentAction error:", err);
        return { error: err.message || "Failed to create department" };
    }
}
export async function updateDepartmentAction(id: number, data: { name: string; description?: string }) {
    try {
        const result = await updateDepartment(id, data);
        revalidatePath("/admin/departments");
        return result;
    } catch (err: any) {
        console.error("updateDepartmentAction error:", err);
        return { error: err.message || "Failed to update department" };
    }
}
export async function deleteDepartmentAction(id: number) {
    try {
        await deleteDepartment(id);
        revalidatePath("/admin/departments");
        return { success: true };
    } catch (err: any) {
        console.error("deleteDepartmentAction error:", err);
        return { error: err.message || "Failed to delete department" };
    }
}

// Mutations - Tasks
export async function createTaskAction(data: Omit<Task, "id">) {
    const user = await getCurrentUserAction();
    return await createTask({
        ...data,
        reportedTo: user?.name || "System"
    });
}
export async function updateTaskAction(id: number, data: Partial<Task>) {
    const user = await getCurrentUserAction();
    return await updateTask(id, {
        ...data,
        reportedTo: user?.name || undefined
    });
}
export async function deleteTaskAction(id: number) {
    const tasks = await getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        const user = await getCurrentUserAction();
        if (user) await moveToTrash(user.id, "Task", id, task);
    }
    return await deleteTask(id);
}

// Helper to generate a medium-strong temporary password
function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

// Mutations - Employees
export async function createEmployeeAction(data: Omit<Employee, "id">) {
    // Generate a temporary secure password
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // The data coming from the modal doesn't have a password anymore
    const employeeWithPassword = {
        ...data,
        password: hashedPassword
    };

    try {
        const created = await createEmployee(employeeWithPassword as any);
        let emailSent = false;
        let emailErrorMsg = "";
        // Send invitation email
        try {
            const rawCreated: any = created;
            await sendInvitationEmail(created.email, tempPassword, `${rawCreated.firstName || rawCreated.first_name} ${rawCreated.lastName || rawCreated.last_name}`);
            emailSent = true;
        } catch (error: any) {
            console.error("Failed to send invitation email:", error);
            emailErrorMsg = error.message || String(error);
        }

        revalidatePath("/admin", "layout");

        return { ...created, tempPassword, emailSent, emailErrorMsg };
    } catch (err: any) {
        console.error("createEmployeeAction error:", err);
        return { error: err.message || "Failed to create employee in database" };
    }
}
export async function updateEmployeeProfileAction(id: number, data: Partial<Employee>) {
    try {
        const updated = await updateEmployeeProfile(id, data as any);
        revalidatePath("/admin", "layout");
        return updated;
    } catch (err: any) {
        console.error("updateEmployeeProfileAction error:", err);
        return { error: err.message || "Failed to update employee in database" };
    }
}
export async function deleteEmployeeAction(id: number) {
    try {
        const employees = await getEmployees();
        const emp = employees.find(e => e.id === id);
        if (emp) {
            // make sure password goes through carefully
            const user = await getCurrentUserAction();
            if (user) await moveToTrash(user.id, "Employee", id, emp);
        }
        await deleteEmployee(id);
        revalidatePath("/admin", "layout");
        return { success: true };
    } catch (err: any) {
        console.error("deleteEmployeeAction error:", err);
        return { error: err.message || "Failed to delete employee" };
    }
}

// Settings
export async function updateAdminSettingsAction(id: number, data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
}) {
    return await updateEmployeeProfile(id, data);
}

export async function updateAdminNotificationsAction(id: number, data: {
    emailNotifications: boolean;
    weeklyReport: boolean;
    securityAlerts: boolean;
}) {
    return await updateEmployeeProfile(id, data);
}

export async function updateAdminSecurityAction(id: number, data: {
    password: string;
}) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await updateEmployeeProfile(id, { password: hashedPassword });
}

import { getNotifications, addNotification, markNotificationRead, markAllNotificationsRead, getAdminUserIds } from "@/lib/notifications";

// ... skipping to timesheets ...

// Timesheets
export async function fetchTimesheetsAction(): Promise<Timesheet[]> {
    return await getTimesheets();
}
export async function fetchEmployeeTimesheetsAction(employeeId: number): Promise<Timesheet[]> {
    return await getEmployeeTimesheets(employeeId);
}
export async function upsertTimesheetAction(data: Omit<Timesheet, "id">) {
    const result = await upsertTimesheet(data);

    // Notify admins if submitted
    if (result.status === "Submitted") {
        try {
            const adminIds = await getAdminUserIds();
            const allUsers = await getUsers();
            const employeeData = allUsers.find(u => u.id === data.employeeId);
            const employeeName = employeeData ? employeeData.name : `Employee #${data.employeeId}`;
            const msg = `${employeeName} has submitted a timesheet for the week of ${data.weekStart}.`;
            // Add notification for each admin
            await Promise.all(adminIds.map(id => addNotification(id, msg)));
        } catch (err) {
            console.error("Failed to push notifications for timesheet submission:", err);
        }
    }
    return result;
}

export async function approveTimesheetAction(timesheetId: number, employeeId: number, weekStart: string) {
    const result = await approveTimesheet(timesheetId);

    // Notify employee
    try {
        await addNotification(employeeId, `Your timesheet for the week of ${weekStart} has been approved.`);
    } catch (err) {
        console.error("Failed to notify employee of approval:", err);
    }

    return result;
}

export async function rejectTimesheetAction(timesheetId: number, employeeId: number, weekStart: string, comment: string) {
    const result = await rejectTimesheet(timesheetId, comment);

    // Notify employee
    try {
        await addNotification(employeeId, `Your timesheet for the week of ${weekStart} was rejected: ${comment}`);
    } catch (err) {
        console.error("Failed to notify employee of rejection:", err);
    }

    return result;
}

// Notifications
export async function fetchNotificationsAction(userId: number) {
    return await getNotifications(userId);
}

export async function markNotificationReadAction(notificationId: number) {
    return await markNotificationRead(notificationId);
}

export async function markAllNotificationsReadAction() {
    const user = await getCurrentUserAction();
    if (!user) return;
    return await markAllNotificationsRead(user.id);
}

// Trash Actions
export async function fetchTrashAction() {
    const user = await getCurrentUserAction();
    if (!user) return [];
    if (user.role === "admin") {
        return await getAllTrash();
    }
    return await getTrashForUser(user.id);
}

export async function restoreTrashAction(id: number) {
    await restoreFromTrash(id);
    revalidatePath("/", "layout");
}

export async function hardDeleteTrashAction(id: number) {
    await hardDeleteTrash(id);
    revalidatePath("/", "layout");
}

// Authentication
export async function loginAction(email: string, password: string): Promise<{ success: boolean; role: any; token?: string; message?: string }> {
    try {
        const users = await getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return { success: false, role: "employee", message: "Invalid email or password" };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { success: false, role: "employee", message: "Invalid email or password" };
        }

        const token = await signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        const cookieStore = await cookies();
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return { success: true, role: user.role, token };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, role: "employee", message: "An unexpected error occurred" };
    }
}

export async function syncSessionAction(token: string) {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
    });
    return { success: true };
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    return { success: true };
}

export async function getCurrentUserAction() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;
    const session = await verifyToken(token);
    console.log(`getCurrentUserAction: session: ${session ? JSON.stringify(session) : 'null'}`);
    return session;
}

// Mutations - TimeTracking
import { getDailyTime, clockIn, pauseTime, clockOut } from "@/lib/timetracking";

export async function getDailyTimeAction(employeeId: number, date: string) {
    try {
        return await getDailyTime(employeeId, date);
    } catch (err: any) {
        console.error("getDailyTime error:", err);
        return { error: err.message || "Failed to get time." };
    }
}

export async function clockInAction(employeeId: number, date: string) {
    try {
        return await clockIn(employeeId, date);
    } catch (err: any) {
        console.error("clockIn error:", err);
        return { error: err.message || "Failed to clock in." };
    }
}

export async function pauseTimeAction(employeeId: number, date: string) {
    try {
        return await pauseTime(employeeId, date);
    } catch (err: any) {
        console.error("pauseTime error:", err);
        return { error: err.message || "Failed to pause." };
    }
}

export async function clockOutAction(employeeId: number, date: string) {
    try {
        return await clockOut(employeeId, date);
    } catch (err: any) {
        console.error("clockOut error:", err);
        return { error: err.message || "Failed to clock out." };
    }
}
