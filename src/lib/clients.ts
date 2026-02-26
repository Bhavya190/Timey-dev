import pool from "./db";

export type ClientStatus = "Active" | "Inactive";

export type Client = {
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
};

export async function getClients(): Promise<Client[]> {
  const result = await pool.query(`SELECT * FROM "Client"`);
  const clients = result.rows;
  return clients.map((c: any) => ({
    ...c,
    status: c.status as ClientStatus,
    nickname: c.nickname ?? undefined,
    address: c.address ?? undefined,
    city: c.city ?? undefined,
    stateRegion: c.stateRegion ?? undefined,
    zip: c.zip ?? undefined,
    contactNumber: c.contactNumber ?? undefined,
    defaultRate: c.defaultRate ?? undefined,
    fixedBidMode: c.fixedBidMode,
  }));
}

export async function createClient(data: Omit<Client, "id">): Promise<Client> {
  const result = await pool.query(
    `INSERT INTO "Client" ("name", "nickname", "email", "country", "address", "city", "stateRegion", "zip", "contactNumber", "defaultRate", "fixedBidMode", "status")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [data.name, data.nickname || null, data.email, data.country, data.address || null, data.city || null, data.stateRegion || null, data.zip || null, data.contactNumber || null, data.defaultRate || null, data.fixedBidMode, data.status]
  );
  const client = result.rows[0];
  return {
    ...client,
    status: client.status as ClientStatus,
    nickname: client.nickname ?? undefined,
    address: client.address ?? undefined,
    city: client.city ?? undefined,
    stateRegion: client.stateRegion ?? undefined,
    zip: client.zip ?? undefined,
    contactNumber: client.contactNumber ?? undefined,
    defaultRate: client.defaultRate ?? undefined,
    fixedBidMode: client.fixedBidMode,
  };
}

export async function updateClient(id: number, data: Partial<Client>): Promise<Client> {
  const result = await pool.query(
    `UPDATE "Client"
     SET 
       "name" = COALESCE($1, "name"),
       "nickname" = COALESCE($2, "nickname"),
       "email" = COALESCE($3, "email"),
       "country" = COALESCE($4, "country"),
       "address" = COALESCE($5, "address"),
       "city" = COALESCE($6, "city"),
       "stateRegion" = COALESCE($7, "stateRegion"),
       "zip" = COALESCE($8, "zip"),
       "contactNumber" = COALESCE($9, "contactNumber"),
       "defaultRate" = COALESCE($10, "defaultRate"),
       "fixedBidMode" = COALESCE($11, "fixedBidMode"),
       "status" = COALESCE($12, "status")
     WHERE "id" = $13
     RETURNING *`,
    [data.name || null, data.nickname || null, data.email || null, data.country || null, data.address || null, data.city || null, data.stateRegion || null, data.zip || null, data.contactNumber || null, data.defaultRate || null, data.fixedBidMode ?? null, data.status || null, id]
  );
  const client = result.rows[0];
  return {
    ...client,
    status: client.status as ClientStatus,
    nickname: client.nickname ?? undefined,
    address: client.address ?? undefined,
    city: client.city ?? undefined,
    stateRegion: client.stateRegion ?? undefined,
    zip: client.zip ?? undefined,
    contactNumber: client.contactNumber ?? undefined,
    defaultRate: client.defaultRate ?? undefined,
    fixedBidMode: client.fixedBidMode,
  };
}

export async function deleteClient(id: number): Promise<void> {
  await pool.query('DELETE FROM "Client" WHERE "id" = $1', [id]);
}

// initialClients export removed, use fetchClientsAction instead
