import pool from "./db";

export type ProjectStatus = "Active" | "On Hold" | "Completed";

export type Project = {
  id: number;
  name: string;
  code: string;
  clientId: number;
  clientName: string;
  teamLeadId: number | null;
  managerId: number | null;
  teamMemberIds?: number[]; // employee ids
  defaultBillingRate?: string;
  billingType?: "fixed" | "hourly";
  fixedCost?: string;
  startDate?: string;
  endDate?: string;
  invoiceFileName?: string;
  description?: string;
  duration?: string;
  estimatedCost?: string;
  budget?: string;
  totalHours?: number;
  status: ProjectStatus;
};

export async function getProjects(): Promise<Project[]> {
  const result1 = await pool.query('SELECT * FROM "Project"');
  const result2 = await pool.query('SELECT * FROM "_TeamMembers"');
  const projects = result1.rows;
  const relations = result2.rows;

  return projects.map(p => ({
    ...p,
    status: p.status as ProjectStatus,
    billingType: p.billingType as "fixed" | "hourly" | undefined,
    teamMemberIds: relations.filter(r => r.B === p.id).map(r => r.A),
    defaultBillingRate: p.defaultBillingRate ?? undefined,
    fixedCost: p.fixedCost ?? undefined,
    startDate: p.startDate ?? undefined,
    endDate: p.endDate ?? undefined,
    invoiceFileName: p.invoiceFileName ?? undefined,
    description: p.description ?? undefined,
    duration: p.duration ?? undefined,
    estimatedCost: p.estimatedCost ?? undefined,
    budget: p.estimatedCost ?? undefined,
    totalHours: 0, // Placeholder
  }));
}

export async function createProject(data: Omit<Project, "id">): Promise<Project> {
  const { teamMemberIds, ...rest } = data;

  const result = await pool.query(
    `INSERT INTO "Project" ("name", "code", "clientId", "clientName", "teamLeadId", "managerId", "defaultBillingRate", "billingType", "fixedCost", "startDate", "endDate", "invoiceFileName", "description", "duration", "estimatedCost", "status")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [rest.name, rest.code, rest.clientId, rest.clientName, rest.teamLeadId, rest.managerId, rest.defaultBillingRate || null, rest.billingType || null, rest.fixedCost || null, rest.startDate || null, rest.endDate || null, rest.invoiceFileName || null, rest.description || null, rest.duration || null, rest.estimatedCost || null, rest.status]
  );
  const project = result.rows[0];

  if (teamMemberIds && teamMemberIds.length > 0) {
    for (const empId of teamMemberIds) {
      await pool.query('INSERT INTO "_TeamMembers" ("A", "B") VALUES ($1, $2)', [empId, project.id]);
    }
  }

  return {
    ...project,
    status: project.status as ProjectStatus,
    billingType: project.billingType as "fixed" | "hourly" | undefined,
    teamMemberIds: teamMemberIds || [],
    defaultBillingRate: project.defaultBillingRate ?? undefined,
    fixedCost: project.fixedCost ?? undefined,
    startDate: project.startDate ?? undefined,
    endDate: project.endDate ?? undefined,
    invoiceFileName: project.invoiceFileName ?? undefined,
    description: project.description ?? undefined,
    duration: project.duration ?? undefined,
    estimatedCost: project.estimatedCost ?? undefined,
    budget: project.estimatedCost ?? undefined,
    totalHours: 0,
  };
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project> {
  const { teamMemberIds, ...rest } = data;

  const result = await pool.query(
    `UPDATE "Project"
     SET 
       "name" = COALESCE($1, "name"),
       "code" = COALESCE($2, "code"),
       "clientId" = COALESCE($3, "clientId"),
       "clientName" = COALESCE($4, "clientName"),
       "teamLeadId" = COALESCE($5, "teamLeadId"),
       "managerId" = COALESCE($6, "managerId"),
       "defaultBillingRate" = COALESCE($7, "defaultBillingRate"),
       "billingType" = COALESCE($8, "billingType"),
       "fixedCost" = COALESCE($9, "fixedCost"),
       "startDate" = COALESCE($10, "startDate"),
       "endDate" = COALESCE($11, "endDate"),
       "invoiceFileName" = COALESCE($12, "invoiceFileName"),
       "description" = COALESCE($13, "description"),
       "duration" = COALESCE($14, "duration"),
       "estimatedCost" = COALESCE($15, "estimatedCost"),
       "status" = COALESCE($16, "status")
     WHERE "id" = $17
     RETURNING *`,
    [rest.name || null, rest.code || null, rest.clientId || null, rest.clientName || null, rest.teamLeadId || null, rest.managerId || null, rest.defaultBillingRate || null, rest.billingType || null, rest.fixedCost || null, rest.startDate || null, rest.endDate || null, rest.invoiceFileName || null, rest.description || null, rest.duration || null, rest.estimatedCost || null, rest.status || null, id]
  );
  const project = result.rows[0];

  if (teamMemberIds) {
    await pool.query('DELETE FROM "_TeamMembers" WHERE "B" = $1', [id]);
    for (const empId of teamMemberIds) {
      await pool.query('INSERT INTO "_TeamMembers" ("A", "B") VALUES ($1, $2)', [empId, id]);
    }
  }

  const relationsResult = await pool.query('SELECT "A" FROM "_TeamMembers" WHERE "B" = $1', [id]);
  const currentRelations = relationsResult.rows;

  return {
    ...project,
    status: project.status as ProjectStatus,
    billingType: project.billingType as "fixed" | "hourly" | undefined,
    teamMemberIds: currentRelations.map(r => r.A),
    defaultBillingRate: project.defaultBillingRate ?? undefined,
    fixedCost: project.fixedCost ?? undefined,
    startDate: project.startDate ?? undefined,
    endDate: project.endDate ?? undefined,
    invoiceFileName: project.invoiceFileName ?? undefined,
    description: project.description ?? undefined,
    duration: project.duration ?? undefined,
    estimatedCost: project.estimatedCost ?? undefined,
    budget: project.estimatedCost ?? undefined,
    totalHours: 0,
  };
}

export async function deleteProject(id: number): Promise<void> {
  // Manual cleanup of many-to-many relationship
  await pool.query('DELETE FROM "_TeamMembers" WHERE "B" = $1', [id]);
  // Delete the project
  await pool.query('DELETE FROM "Project" WHERE "id" = $1', [id]);
}

// initialProjects export removed, use fetchProjectsAction instead
