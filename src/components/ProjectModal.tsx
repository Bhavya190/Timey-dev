"use client";

import { FormEvent, useEffect, useState } from "react";
import Select, { type MultiValue, components } from "react-select";
import type { ProjectStatus } from "@/lib/projects";
import { Project, fetchProjectsAction, fetchUsersAction, fetchClientsAction, User, Client, createClientAction } from "@/app/actions";
import {
  Building2,
  Users,
  DollarSign,
  Settings,
  Plus,
  type LucideIcon,
} from "lucide-react";
import ClientModal from "./ClientModal";

type Mode = "add" | "edit";
type TabKey = "basic" | "team" | "billing" | "advanced";

type Props = {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onSave: (project: Project) => void;
  nextId: number;
  project?: Project | null;
};

// type EmployeeOption = { value: number; label: string }; // moved inside ProjectModal

type TabConfig = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

const tabs: TabConfig[] = [
  { key: "basic", label: "Basic", icon: Building2 },
  { key: "team", label: "Team", icon: Users },
  { key: "billing", label: "Billing", icon: DollarSign },
  { key: "advanced", label: "Advance", icon: Settings },
];

export default function ProjectModal({
  open,
  mode,
  onClose,
  onSave,
  nextId,
  project,
}: Props) {
  const isEdit = mode === "edit";

  const [employeeOptions, setEmployeeOptions] = useState<User[]>([]);
  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  // Basic
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [teamLeadId, setTeamLeadId] = useState<number | null>(null);
  const [managerId, setManagerId] = useState<number | null>(null);
  const [code, setCode] = useState("");

  // Team
  const [teamMemberIds, setTeamMemberIds] = useState<number[]>([]);

  // Billing
  const [defaultBillingRate, setDefaultBillingRate] = useState("");
  const [billingType, setBillingType] = useState<"fixed" | "hourly">("hourly");
  const [fixedCost, setFixedCost] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // Advanced
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Active");

  const [error, setError] = useState("");

  const refreshClients = async () => {
    const c = await fetchClientsAction();
    setClientOptions(c);
    return c;
  };

  useEffect(() => {
    if (!open) return;

    setLoadingOptions(true);
    Promise.all([fetchClientsAction(), fetchUsersAction()]).then(([c, u]) => {
      setClientOptions(c);
      setEmployeeOptions(u.filter((user) => user.role === "employee" || user.role === "teamLead"));
      setLoadingOptions(false);
    });

    if (isEdit && project) {
      setName(project.name);
      setClientId(project.clientId);
      setClientName(project.clientName);
      setCode(project.code);
      setTeamLeadId(project.teamLeadId ?? null);
      setManagerId(project.managerId ?? null);
      setTeamMemberIds(project.teamMemberIds ?? []);
      setDefaultBillingRate(project.defaultBillingRate ?? "");
      setBillingType(project.billingType ?? "hourly");
      setFixedCost(project.fixedCost ?? "");
      setStartDate(project.startDate ?? "");
      setEndDate(project.endDate ?? "");
      setDescription(project.description ?? "");
      setDuration(project.duration ?? "");
      setEstimatedCost(project.estimatedCost ?? "");
      setStatus(project.status);
      setInvoiceFile(null);
      setActiveTab("basic");
      setError("");
    } else {
      setName("");
      setClientId(null);
      setClientName("");
      setCode("");
      setTeamLeadId(null);
      setManagerId(null);
      setTeamMemberIds([]);
      setDefaultBillingRate("");
      setBillingType("hourly");
      setFixedCost("");
      setStartDate("");
      setEndDate("");
      setInvoiceFile(null);
      setDescription("");
      setDuration("");
      setEstimatedCost("");
      setStatus("Active");
      setActiveTab("basic");
      setError("");
    }
  }, [open, isEdit, project]);

  if (!open) return null;

  // validate only fields from Basic tab
  const validateBasicTab = () => {
    const selectedClient =
      clientId == null ? null : clientOptions.find((c) => c.id === clientId);

    if (!name || !code || teamLeadId === null || !selectedClient) {
      setError(
        clientOptions.length === 0
          ? "No clients found. Please add a client before creating a project."
          : "Project name, client, code and team lead are required."
      );
      setActiveTab("basic");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // If not the last tab, move to the next tab
    if (!isLastTab) {
      goToNextTab();
      return;
    }

    // ensure basic tab is valid even if user submits directly
    if (!validateBasicTab()) return;

    const selectedClient =
      clientId == null ? null : clientOptions.find((c) => c.id === clientId);

    if (!selectedClient) {
      setError("Client is required.");
      setActiveTab("basic");
      return;
    }

    const newProject: Project = {
      id: isEdit && project ? project.id : nextId,
      name,
      code,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      teamLeadId,
      managerId,
      teamMemberIds,
      defaultBillingRate,
      billingType,
      fixedCost,
      startDate,
      endDate,
      invoiceFileName: invoiceFile?.name,
      description,
      duration,
      estimatedCost,
      status,
    };

    onSave(newProject);
    onClose();
  };

  const resetAndClose = () => {
    setError("");
    onClose();
  };

  const getEmployeeName = (id: number) =>
    employeeOptions.find((e) => e.id === id)?.name ?? "Unknown";

  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--background)",
      borderColor: state.isFocused
        ? "rgb(16 185 129)"
        : "var(--border)",
      boxShadow: state.isFocused
        ? "0 0 0 1px rgba(16,185,129,0.4)"
        : "none",
      minHeight: "2.5rem",
      borderRadius: "0.5rem",
      cursor: "pointer",
      ":hover": {
        borderColor: state.isFocused
          ? "rgb(16 185 129)"
          : "hsl(var(--border))",
      },
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "0 0.75rem",
      gap: 0,
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted)",
      fontSize: "0.875rem",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground)",
      fontSize: "0.875rem",
    }),
    input: (base: any) => ({
      ...base,
      color: "var(--foreground)",
      fontSize: "0.875rem",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused
        ? "rgb(16 185 129)"
        : "var(--muted)",
      paddingRight: "0.5rem",
      ":hover": {
        color: "rgb(16 185 129)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--card)",
      borderRadius: "0.5rem",
      overflow: "hidden",
      border: "1px solid var(--border)",
      boxShadow:
        "0 10px 15px -3px rgba(15,23,42,0.25), 0 4px 6px -4px rgba(15,23,42,0.2)",
      zIndex: 100,
    }),
    menuList: (base: any) => ({
      ...base,
      paddingTop: 4,
      paddingBottom: 4,
      maxHeight: 200,
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: "0.875rem",
      padding: "0.4rem 0.75rem",
      backgroundColor: state.isSelected
        ? "rgba(16,185,129,0.12)"
        : state.isFocused
          ? "rgba(148,163,184,0.15)"
          : "transparent",
      color: "var(--foreground)",
      cursor: "pointer",
    }),
    noOptionsMessage: (base: any) => ({
      ...base,
      fontSize: "0.875rem",
      color: "var(--muted)",
      padding: "1rem",
    }),
  };

  const employeeSelectStyles = {
    ...customSelectStyles,
    multiValue: () => ({
      display: "none",
    }),
  };

  type EmployeeOption = { value: number; label: string };
  type ClientOption = { value: number; label: string };

  const employeeSelectOptions: EmployeeOption[] = employeeOptions.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const clientSelectOptions: ClientOption[] = clientOptions.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const selectedClientOption = clientId
    ? clientSelectOptions.find((opt) => opt.value === clientId)
    : null;

  const selectedTeamOptions: EmployeeOption[] = employeeSelectOptions.filter(
    (opt) => teamMemberIds.includes(opt.value)
  );

  const isLastTab = activeTab === "advanced";

  const goToNextTab = () => {
    const order: TabKey[] = ["basic", "team", "billing", "advanced"];

    if (activeTab === "basic") {
      const ok = validateBasicTab();
      if (!ok) return;
    }

    const idx = order.indexOf(activeTab);
    if (idx < order.length - 1) {
      setActiveTab(order[idx + 1]);
    }
  };

  const goToPrevTab = () => {
    const order: TabKey[] = ["basic", "team", "billing", "advanced"];
    const idx = order.indexOf(activeTab);
    if (idx > 0) {
      setActiveTab(order[idx - 1]);
    }
  };

  const NoOptionsMessage = (props: any) => {
    return (
      <components.NoOptionsMessage {...props}>
        <div className="flex flex-col items-center gap-3">
          <span>{props.children}</span>
          <button
            type="button"
            onClick={() => setIsClientModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all w-full justify-center"
          >
            <Plus className="h-4 w-4" />
            Add New Client
          </button>
        </div>
      </components.NoOptionsMessage>
    );
  };

  const handleSaveNewClient = async (newClient: Client) => {
    try {
      // 1. Actually save the client to DB
      const saved: any = await createClientAction(newClient);

      if (saved.error) {
        alert(saved.error);
        return;
      }

      // 2. Refresh client list
      const updatedClients = await refreshClients();

      // 3. Select the newly created client
      setClientId(saved.id);
      setClientName(saved.name);

      // 4. Close modal
      setIsClientModalOpen(false);
    } catch (err) {
      console.error("Failed to save client:", err);
      alert("Failed to save client. Please try again.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
        <div className="relative w-full max-w-4xl rounded-2xl bg-card text-foreground shadow-2xl border border-border max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold">
              {isEdit ? "Edit Project" : "Add Project"}
            </h2>
            <button
              type="button"
              onClick={resetAndClose}
              className="h-7 w-7 rounded-full border border-border text-muted hover:bg-muted"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                    ? "text-emerald-500"
                    : "text-muted hover:text-foreground"
                    }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {activeTab === tab.key && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Form & Footer combined for submission */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* BASIC TAB */}
              {activeTab === "basic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Project Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Project Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                      required
                    />
                  </div>

                  {/* Client searchable select */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Client<span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={clientSelectOptions}
                      value={selectedClientOption}
                      onChange={(opt) => {
                        const val = opt as ClientOption;
                        setClientId(val?.value ?? null);
                        setClientName(val?.label ?? "");
                      }}
                      placeholder="Select client"
                      classNamePrefix="react-select"
                      styles={customSelectStyles}
                      isClearable={false}
                      components={{ NoOptionsMessage }}
                      menuPlacement="auto"
                    />
                  </div>

                  {/* Team Lead */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Team Lead<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={teamLeadId === null ? "" : String(teamLeadId)}
                      onChange={(e) =>
                        setTeamLeadId(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                      required
                    >
                      <option value="">Select team lead</option>
                      {employeeOptions.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Project Manager */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Project Manager
                    </label>
                    <select
                      value={managerId === null ? "" : String(managerId)}
                      onChange={(e) =>
                        setManagerId(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    >
                      <option value="">Select manager</option>
                      {employeeOptions.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Project Code */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-foreground">
                      Project Code<span className="text-red-500">*</span>
                    </label>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="PRJ-001"
                      className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                      required
                    />
                  </div>
                </div>
              )}

              {/* TEAM TAB */}
              {activeTab === "team" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted">
                    Select one or more employees to assign them to this project
                    team.
                  </p>

                  {teamMemberIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-1">
                      {teamMemberIds.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-500"
                        >
                          {getEmployeeName(id)}
                          <button
                            type="button"
                            onClick={() =>
                              setTeamMemberIds((prev) =>
                                prev.filter((x) => x !== id)
                              )
                            }
                            className="text-[10px] leading-none"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <Select
                    isMulti
                    options={employeeSelectOptions}
                    value={selectedTeamOptions}
                    onChange={(newValue) => {
                      const arr = (newValue as MultiValue<EmployeeOption>) ?? [];
                      const ids = arr.map((opt) => opt.value);
                      setTeamMemberIds(ids);
                    }}
                    placeholder="Select team member(s)"
                    classNamePrefix="react-select"
                    styles={employeeSelectStyles}
                    isClearable={false}
                    components={{ ClearIndicator: () => null }}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                  />
                </div>
              )}

              {/* BILLING TAB */}
              {activeTab === "billing" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Default Billing Rate
                    </label>
                    <input
                      type="number"
                      value={defaultBillingRate}
                      onChange={(e) => setDefaultBillingRate(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Project billing type
                    </label>
                    <select
                      value={billingType}
                      onChange={(e) =>
                        setBillingType(e.target.value as "fixed" | "hourly")
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    >
                      <option value="fixed">Fixed bid</option>
                      <option value="hourly">Per hour</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Fixed cost
                    </label>
                    <input
                      type="number"
                      value={fixedCost}
                      onChange={(e) => setFixedCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-foreground">
                      Invoice (pdf)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setInvoiceFile(e.target.files?.[0] ?? null)
                      }
                      className="block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80"
                    />
                  </div>
                </div>
              )}

              {/* ADVANCED TAB */}
              {activeTab === "advanced" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-foreground">
                      Project Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Duration
                    </label>
                    <input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 3 months"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Estimated Cost
                    </label>
                    <input
                      type="number"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Project Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as ProjectStatus)
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer inside form so submit button works */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-3">
              <div className="flex items-center gap-3">
                {activeTab !== "basic" && (
                  <button
                    type="button"
                    onClick={goToPrevTab}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  Cancel
                </button>

                {isLastTab ? (
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <ClientModal
        open={isClientModalOpen}
        mode="add"
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveNewClient}
        nextId={clientOptions.length + 1}
      />
    </>
  );
}
