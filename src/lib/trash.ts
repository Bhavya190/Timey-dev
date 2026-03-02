import pool from "./db";

export type TrashItemType = "Employee" | "Client" | "Project" | "Task";

export interface TrashItem {
  id: number;
  userId: number;
  entityType: TrashItemType;
  entityId: number;
  entityData: any; // JSONB
  createdAt: string;
}

export async function moveToTrash(
  userId: number,
  entityType: TrashItemType,
  entityId: number,
  entityData: any
): Promise<void> {
  await pool.query(
    `INSERT INTO "Trash" ("userId", "entityType", "entityId", "entityData") 
     VALUES ($1, $2, $3, $4)`,
    [userId, entityType, entityId, JSON.stringify(entityData)]
  );
}

export async function getTrashForUser(userId: number): Promise<TrashItem[]> {
  const result = await pool.query(
    `SELECT * FROM "Trash" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
    [userId]
  );
  return result.rows;
}

// Get all trash if user is admin
export async function getAllTrash(): Promise<TrashItem[]> {
  const result = await pool.query(
    `SELECT * FROM "Trash" ORDER BY "createdAt" DESC`
  );
  return result.rows;
}

export async function restoreFromTrash(trashId: number): Promise<void> {
  // 1. Fetch the trash item
  const trashRes = await pool.query(`SELECT * FROM "Trash" WHERE "id" = $1`, [
    trashId,
  ]);
  const item = trashRes.rows[0];

  if (!item) {
    throw new Error("Trash item not found");
  }

  const { entityType, entityData } = item;

  // 2. Re-insert based on entity type. Since we store complete JSON snapshots,
  // we just pull the fields we need. For relationships like `_AssigneeTasks` or `_TeamMembers`,
  // we rebuild them after insertion.
  try {
    switch (entityType) {
      case "Employee":
        await pool.query(
          `INSERT INTO "Employee" (
             "id", "firstName", "lastName", "email", "password", "role", 
             "code", "department", "location", "shift", "address", "city", 
             "stateRegion", "country", "zip", "phone", "hireDate", 
             "workType", "billingType", "employeeRate", "employeeCurrency", 
             "billingRateType", "billingCurrency", "billingStart", "billingEnd"
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
             $19, $20, $21, $22, $23, $24, $25
           )`,
          [
            entityData.id,
            entityData.firstName,
            entityData.lastName,
            entityData.email,
            entityData.password,
            entityData.role,
            entityData.code,
            entityData.department,
            entityData.location,
            entityData.shift,
            entityData.address,
            entityData.city,
            entityData.stateRegion,
            entityData.country,
            entityData.zip,
            entityData.phone,
            entityData.hireDate,
            entityData.workType,
            entityData.billingType,
            entityData.employeeRate,
            entityData.employeeCurrency,
            entityData.billingRateType,
            entityData.billingCurrency,
            entityData.billingStart,
            entityData.billingEnd,
          ]
        );
        break;

      case "Client":
        await pool.query(
          `INSERT INTO "Client" (
             "id", "name", "nickname", "email", "country", "address", "city", 
             "stateRegion", "zip", "contactNumber", "defaultRate", "fixedBidMode", "status"
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
           )`,
          [
            entityData.id,
            entityData.name,
            entityData.nickname,
            entityData.email,
            entityData.country,
            entityData.address,
            entityData.city,
            entityData.stateRegion,
            entityData.zip,
            entityData.contactNumber,
            entityData.defaultRate,
            entityData.fixedBidMode,
            entityData.status,
          ]
        );
        break;

      case "Project":
        await pool.query(
          `INSERT INTO "Project" (
             "id", "name", "code", "clientId", "clientName", "teamLeadId", 
             "managerId", "defaultBillingRate", "billingType", "fixedCost", 
             "startDate", "endDate", "invoiceFileName", "description", 
             "duration", "estimatedCost", "status"
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
           )`,
          [
            entityData.id,
            entityData.name,
            entityData.code,
            entityData.clientId,
            entityData.clientName,
            entityData.teamLeadId,
            entityData.managerId,
            entityData.defaultBillingRate,
            entityData.billingType,
            entityData.fixedCost,
            entityData.startDate,
            entityData.endDate,
            entityData.invoiceFileName,
            entityData.description,
            entityData.duration,
            entityData.estimatedCost,
            entityData.status,
          ]
        );

        if (entityData.teamMemberIds && entityData.teamMemberIds.length > 0) {
          for (const empId of entityData.teamMemberIds) {
            await pool.query(
              'INSERT INTO "_TeamMembers" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [empId, entityData.id]
            );
          }
        }
        break;

      case "Task":
        await pool.query(
          `INSERT INTO "Task" (
             "id", "projectId", "projectName", "name", "workedHours", 
             "startDate", "dueDate", "reportedTo", "status", "description", "billingType"
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
           )`,
          [
            entityData.id,
            entityData.projectId,
            entityData.projectName,
            entityData.name,
            entityData.workedHours,
            entityData.date, // mapped back to startDate
            entityData.dueDate,
            entityData.reportedTo,
            entityData.status,
            entityData.description,
            entityData.billingType,
          ]
        );

        if (entityData.assigneeIds && entityData.assigneeIds.length > 0) {
          for (const empId of entityData.assigneeIds) {
            await pool.query(
              'INSERT INTO "_AssigneeTasks" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [empId, entityData.id]
            );
          }
        }
        break;

      default:
        throw new Error("Unknown entity type");
    }

    // 3. Remove from Trash
    await hardDeleteTrash(trashId);
  } catch (err: any) {
    if (err.code === "23505") { // unique violation
      throw new Error(`Failed to restore: An item with the same identifier already exists.`);
    }
    throw new Error(`Restore failed: ${err.message}`);
  }
}

export async function hardDeleteTrash(trashId: number): Promise<void> {
  await pool.query(`DELETE FROM "Trash" WHERE "id" = $1`, [trashId]);
}

export async function cleanupTrash(): Promise<void> {
  // Delete everything older than 30 days
  await pool.query(
    `DELETE FROM "Trash" WHERE "createdAt" < NOW() - INTERVAL '30 days'`
  );
}
