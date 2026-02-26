"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Project, ProjectStatus } from "@/lib/projects";
import {
  fetchProjectsAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
} from "@/app/actions";
import ProjectModal from "@/components/ProjectModal";
import { ChevronLeft, ChevronRight, Calendar, ChevronUp, ChevronDown, FileDown } from "lucide-react";

function StatusBadge({ status }: { status: ProjectStatus }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  if (status === "Active") {
    return (
      <span
        className={`${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/40`}
      >
        Active
      </span>
    );
  }
  if (status === "Completed") {
    return (
      <span
        className={`${base} bg-sky-500/10 text-sky-500 border-sky-500/40`}
      >
        Completed
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-amber-500/10 text-amber-500 border-amber-500/40`}
    >
      On Hold
    </span>
  );
}

type StatusFilter = "All" | ProjectStatus;

const formatDateShortWithYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function toLocalISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekRange(anchor: Date = new Date()) {
  const day = anchor.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - diffToMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return {
    start: toLocalISODate(monday),
    end: toLocalISODate(sunday),
  };
}

export default function AdminProjects() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjectsAction().then((data) => {
      setProjects(data);
      setIsLoading(false);
    });
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "name", direction: "asc" });

  // weekly range
  const { start: initialStart, end: initialEnd } = useMemo(() => getWeekRange(), []);

  const [startISO, setStartISO] = useState<string>(initialStart);
  const [endISO, setEndISO] = useState<string>(initialEnd);

  const goPrevWeek = () => {
    const [y, m, d] = startISO.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 7);
    const { start, end } = getWeekRange(prev);
    setStartISO(start);
    setEndISO(end);
  };

  const goNextWeek = () => {
    const [y, m, d] = startISO.split("-").map(Number);
    const next = new Date(y, m - 1, d + 7);
    const { start, end } = getWeekRange(next);
    setStartISO(start);
    setEndISO(end);
  };

  const setWeekFromAnchor = (anchor: Date) => {
    const { start, end } = getWeekRange(anchor);
    setStartISO(start);
    setEndISO(end);
  };

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const items = projects.filter((project) => {
      const projectStart =
        project.startDate && project.startDate.length >= 10
          ? project.startDate.slice(0, 10)
          : "0000-01-01";
      const projectEnd =
        project.endDate && project.endDate.length >= 10
          ? project.endDate.slice(0, 10)
          : "9999-12-31";

      const inRange = projectEnd >= startISO && projectStart <= endISO;

      const matchesSearch =
        !term ||
        project.name.toLowerCase().includes(term) ||
        project.code.toLowerCase().includes(term) ||
        project.clientName.toLowerCase().includes(term) ||
        project.status.toLowerCase().includes(term);

      return inRange && matchesSearch;
    });

    if (sortConfig.key) {
      items.sort((a, b) => {
        let aVal = (a as any)[sortConfig.key] || "";
        let bVal = (b as any)[sortConfig.key] || "";

        if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
          aVal = aVal || (sortConfig.direction === "asc" ? "9999-99-99" : "0000-00-00");
          bVal = bVal || (sortConfig.direction === "asc" ? "9999-99-99" : "0000-00-00");
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [projects, searchTerm, startISO, endISO, sortConfig]);

  const handleRowClick = (id: number) => {
    router.push(`/admin/projects/${id}`);
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteProjectAction(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleView = (project: Project) => {
    router.push(`/admin/projects/${project.id}`);
    setOpenMenuId(null);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setModalMode("edit");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleAddProjectClick = () => {
    setSelectedProject(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  // SAVE: update list, close modal, clear selection
  const handleSaveProject = async (project: Project) => {
    try {
      if (modalMode === "add") {
        const { id, ...data } = project;
        const created = await createProjectAction(data);
        setProjects((prev) => [...prev, created]);
      } else {
        const { id, ...data } = project;
        const updated = await updateProjectAction(id, data);
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? updated : p))
        );
      }
      setIsModalOpen(false);
      setSelectedProject(null);
    } catch (err) {
      console.error("Failed to save project:", err);
      alert("Failed to save project. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleExportCSV = () => {
    if (filteredProjects.length === 0) {
      alert("No data to export for current filters.");
      return;
    }

    const exportRows = filteredProjects.map((p) => ({
      Name: p.name,
      Status: p.status,
      Code: p.code,
      Client: p.clientName,
      StartDate: p.startDate || "",
      EndDate: p.endDate || "",
      Budget: p.budget || 0,
      TotalHours: p.totalHours || 0,
    }));

    const header = Object.keys(exportRows[0]);
    const csv = [
      header,
      ...exportRows.map((row) => header.map((key) => (row as any)[key])),
    ]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `projects_${startISO}_to_${endISO}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const nextId =
    projects.length === 0 ? 1 : Math.max(...projects.map((p) => p.id)) + 1;

  const handleSort = (key: string) => {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted">
            Active, on‑hold and completed projects for all clients.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Date range pill */}
          <div className="flex flex-wrap items-center justify-end">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground">
              <button
                type="button"
                onClick={goPrevWeek}
                className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                title="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <span>
                  {formatDateShortWithYear(startISO)} –{" "}
                  {formatDateShortWithYear(endISO)}
                </span>
                <div className="relative">
                  <input
                    type="date"
                    value={startISO}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const selectedDate = new Date(e.target.value);
                      setWeekFromAnchor(selectedDate);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Select week date"
                  />
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted hover:bg-card cursor-pointer pointer-events-none">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={goNextWeek}
                className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                title="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add Project button */}
          <button
            onClick={handleAddProjectClick}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
          >
            + Add Project
          </button>
        </div>
      </div>

      {/* Container */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-medium text-foreground">
              {filteredProjects.length}
            </span>
            <span>projects</span>
            {(searchTerm) && (
              <span className="text-[11px] text-muted">
                (filtered from {projects.length})
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search projects"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
            />

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-1.5 text-xs font-medium text-foreground hover:bg-card transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export CSV
            </button>
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
                    Project <SortIcon column="name" />
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
                  onClick={() => handleSort("code")}
                >
                  <div className="flex items-center gap-1">
                    Code <SortIcon column="code" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("clientName")}
                >
                  <div className="flex items-center gap-1">
                    Client <SortIcon column="clientName" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium hidden md:table-cell cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("startDate")}
                >
                  <div className="flex items-center gap-1">
                    Start Date <SortIcon column="startDate" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium hidden md:table-cell cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("endDate")}
                >
                  <div className="flex items-center gap-1">
                    End Date <SortIcon column="endDate" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    Loading projects...
                  </td>
                </tr>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-background/60 cursor-pointer"
                    onClick={() => handleRowClick(project.id)}
                  >
                    <td className="px-4 py-3 text-foreground">
                      {project.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {project.code}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {project.clientName}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted">
                      {project.startDate || "-"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted">
                      {project.endDate || "-"}
                    </td>
                    <td
                      className="relative px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleMenu(project.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-card"
                      >
                        ⋮
                      </button>

                      {openMenuId === project.id && (
                        <div className="absolute right-4 top-11 z-10 w-40 rounded-lg border border-border bg-card text-xs shadow-lg">
                          <button
                            onClick={() => handleView(project)}
                            className="block w-full px-3 py-2 text-left hover:bg-background/70"
                          >
                            View details
                          </button>
                          <button
                            onClick={() => handleEdit(project)}
                            className="block w-full px-3 py-2 text-left hover:bg-background/70"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemove(project.id)}
                            className="block w-full px-3 py-2 text-left text-red-500 hover:bg-red-500/10"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    No matching projects.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Project Modal */}
      <ProjectModal
        open={isModalOpen}
        mode={modalMode}
        onClose={handleCloseModal}
        onSave={handleSaveProject}
        nextId={nextId}
        project={selectedProject ?? undefined}
      />
    </div>
  );
}
