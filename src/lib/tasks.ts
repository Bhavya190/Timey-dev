import pool from "./db";

export type TaskStatus = "Not Started" | "In Progress" | "Completed";
export type TaskBillingType = "billable" | "non-billable";

export type Task = {
  id: number;
  projectId: number;
  projectName: string;
  name: string;
  workedHours: number;
  assigneeIds: number[];
  date: string; // YYYY-MM-DD
  dueDate?: string;
  reportedTo?: string;
  status: TaskStatus;
  description?: string;
  billingType: TaskBillingType;
};

export async function getTasks(): Promise<Task[]> {
  const result1 = await pool.query('SELECT * FROM "Task"');
  const result2 = await pool.query('SELECT * FROM "_AssigneeTasks"');
  const tasks = result1.rows;
  const relations = result2.rows;

  return tasks.map(t => ({
    ...t,
    status: t.status as TaskStatus,
    billingType: t.billingType as TaskBillingType,
    assigneeIds: relations.filter(r => r.B === t.id).map(r => r.A),
    date: t.startDate,
    description: t.description ?? undefined,
  }));
}

export async function createTask(data: Omit<Task, "id">): Promise<Task> {
  const { assigneeIds, ...rest } = data;

  const result = await pool.query(
    `INSERT INTO "Task" (
       "projectId", "projectName", "name", "workedHours", 
       "startDate", "dueDate", "reportedTo", "status", "description", "billingType"
     ) VALUES (
       $1, $2, $3, $4, 
       $5, $6, $7, $8, $9, $10
     ) RETURNING *`,
    [rest.projectId, rest.projectName, rest.name, rest.workedHours, rest.date, rest.dueDate || null, rest.reportedTo || null, rest.status, rest.description || null, rest.billingType]
  );
  const task = result.rows[0];

  if (assigneeIds && assigneeIds.length > 0) {
    for (const empId of assigneeIds) {
      await pool.query('INSERT INTO "_AssigneeTasks" ("A", "B") VALUES ($1, $2)', [empId, task.id]);
    }
  }

  return {
    ...task,
    status: task.status as TaskStatus,
    billingType: task.billingType as TaskBillingType,
    assigneeIds: assigneeIds ?? [],
    date: task.startDate,
    description: task.description ?? undefined,
  };
}

export async function updateTask(id: number, data: Partial<Task>): Promise<Task> {
  const { assigneeIds, ...rest } = data;

  const result = await pool.query(
    `UPDATE "Task"
     SET 
       "projectId" = COALESCE($1, "projectId"),
       "projectName" = COALESCE($2, "projectName"),
       "name" = COALESCE($3, "name"),
       "workedHours" = COALESCE($4, "workedHours"),
       "startDate" = COALESCE($5, "startDate"),
       "dueDate" = COALESCE($6, "dueDate"),
       "reportedTo" = COALESCE($7, "reportedTo"),
       "status" = COALESCE($8, "status"),
       "description" = COALESCE($9, "description"),
       "billingType" = COALESCE($10, "billingType")
     WHERE "id" = $11
     RETURNING *`,
    [rest.projectId || null, rest.projectName || null, rest.name || null, rest.workedHours ?? null, rest.date || null, rest.dueDate || null, rest.reportedTo || null, rest.status || null, rest.description || null, rest.billingType || null, id]
  );
  const task = result.rows[0];

  if (assigneeIds) {
    await pool.query('DELETE FROM "_AssigneeTasks" WHERE "B" = $1', [id]);
    for (const empId of assigneeIds) {
      await pool.query('INSERT INTO "_AssigneeTasks" ("A", "B") VALUES ($1, $2)', [empId, id]);
    }
  }

  const relationsResult = await pool.query('SELECT "A" FROM "_AssigneeTasks" WHERE "B" = $1', [id]);
  const currentRelations = relationsResult.rows;

  return {
    ...task,
    status: task.status as TaskStatus,
    billingType: task.billingType as TaskBillingType,
    assigneeIds: currentRelations.map(r => r.A),
    date: task.startDate,
    description: task.description ?? undefined,
  };
}

export async function deleteTask(id: number): Promise<void> {
  await pool.query('DELETE FROM "_AssigneeTasks" WHERE "B" = $1', [id]);
  await pool.query('DELETE FROM "Task" WHERE "id" = $1', [id]);
}

// initialTasks export removed, use fetchTasksAction instead
