"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@/lib/clients";
import {
  fetchClientsAction,
  createClientAction,
  updateClientAction,
  deleteClientAction,
} from "@/app/actions";
import { ChevronUp, ChevronDown } from "lucide-react";
import ClientModal from "@/components/ClientModal";

function StatusBadge({ status }: { status: Client["status"] }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${isActive
        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/40"
        : "bg-muted text-muted-foreground border-border"
        }`}
    >
      {status}
    </span>
  );
}

export default function AdminClients() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchClientsAction().then((data) => {
      setClients(data);
      setIsLoading(false);
    });
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Client | "name";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  const handleRowClick = (id: number) => {
    router.push(`/admin/clients/${id}`);
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteClientAction(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to delete client:", err);
      alert("Failed to delete client. Please try again.");
    }
  };

  const handleView = (client: Client) => {
    router.push(`/admin/clients/${client.id}`);
    setOpenMenuId(null);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setModalMode("edit");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleAddClientClick = () => {
    setSelectedClient(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleSaveClient = async (client: Client) => {
    try {
      if (modalMode === "add") {
        const { id, ...data } = client;
        const created = await createClientAction(data);
        setClients((prev) => [...prev, created]);
      } else {
        const { id, ...data } = client;
        const updated = await updateClientAction(id, data);
        setClients((prev) =>
          prev.map((c) => (c.id === id ? updated : c))
        );
      }
      setIsModalOpen(false);
      setSelectedClient(null);
    } catch (err) {
      console.error("Failed to save client:", err);
      alert("Failed to save client. Please try again.");
    }
  };

  const handleSort = (key: keyof Client | "name") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  const nextId =
    clients.length === 0 ? 1 : Math.max(...clients.map((c) => c.id)) + 1;

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let items = clients.filter((client) => {
      const matchesSearch =
        !term ||
        client.name.toLowerCase().includes(term) ||
        (client.nickname ?? "").toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.country.toLowerCase().includes(term);

      return matchesSearch;
    });

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = (a as any)[sortConfig.key] ?? "";
        const bVal = (b as any)[sortConfig.key] ?? "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [clients, searchTerm, sortConfig]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted">
            All active and inactive clients managed by the admin.
          </p>
        </div>

        <button
          onClick={handleAddClientClick}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
        >
          + Add Client
        </button>
      </div>

      {/* Container */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-medium text-foreground">
              {filteredClients.length}
            </span>
            <span>clients</span>
            {searchTerm && (
              <span className="text-[11px] text-muted">
                (filtered from {clients.length})
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name, email, country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-background/80 text-muted border-b border-border">
              <tr>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Client <SortIcon column="name" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    Status <SortIcon column="status" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("nickname")}
                >
                  <div className="flex items-center gap-1">
                    Nickname <SortIcon column="nickname" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    Email <SortIcon column="email" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("country")}
                >
                  <div className="flex items-center gap-1">
                    Country <SortIcon column="country" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-background/60 cursor-pointer"
                  onClick={() => handleRowClick(client.id)}
                >
                  <td className="px-4 py-3 text-foreground">
                    {client.name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {client.nickname || "-"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <span className="font-mono text-[11px] sm:text-xs">
                      {client.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {client.country}
                  </td>
                  <td
                    className="relative px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => toggleMenu(client.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-card"
                    >
                      ⋮
                    </button>

                    {openMenuId === client.id && (
                      <div className="absolute right-4 top-11 z-10 w-40 rounded-lg border border-border bg-card text-xs shadow-lg">
                        <button
                          onClick={() => handleView(client)}
                          className="block w-full px-3 py-2 text-left hover:bg-background/70"
                        >
                          View details
                        </button>
                        <button
                          onClick={() => handleEdit(client)}
                          className="block w-full px-3 py-2 text-left hover:bg-background/70"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(client.id)}
                          className="block w-full px-3 py-2 text-left text-red-500 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {(filteredClients.length === 0 && !isLoading) && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    No clients found.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    Loading clients...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      <ClientModal
        open={isModalOpen}
        mode={modalMode}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        nextId={nextId}
        client={selectedClient ?? undefined}
      />
    </div>
  );
}
