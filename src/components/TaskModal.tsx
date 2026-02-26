"use client";

import { FormEvent, useEffect, useState } from "react";
import Select, { type MultiValue } from "react-select";
import type { Task, TaskStatus, TaskBillingType } from "@/lib/tasks";
import { Project, fetchProjectsAction, fetchUsersAction, User } from "@/app/actions";
import {
  FileText,
  Clock,
  Users,
  type LucideIcon,
} from "lucide-react"; // icons for tabs [web:11][web:21][web:23][web:24]

type Mode = "add" | "edit";
type TabKey = "details" | "time" | "people";

type Props = {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onSave: (task: Task) => void;
  nextId: number;
  task?: Task | null;
};

// type EmployeeOption = { value: number; label: string }; // moved inside TaskModal

type TabConfig = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

const tabs: TabConfig[] = [
  { key: "details", label: "Details", icon: FileText },
  { key: "time", label: "Time & Billing", icon: Clock },
  { key: "people", label: "Assignees", icon: Users },
];

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TaskModal({
  open,
  mode,
  onClose,
  onSave,
  nextId,
  task,
}: Props) {
  const isEdit = mode === "edit";

  const [projectOptions, setProjectOptions] = useState<Project[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<User[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const [projectId, setProjectId] = useState<number | null>(null);
  const [taskName, setTaskName] = useState("");
  const [workedHours, setWorkedHours] = useState<string>("0");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>("Not Started");
  const [billingType, setBillingType] =
    useState<TaskBillingType>("billable");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setLoadingOptions(true);
    Promise.all([fetchProjectsAction(), fetchUsersAction()]).then(([p, u]) => {
      setProjectOptions(p);
      setEmployeeOptions(u.filter((user) => user.role === "employee" || user.role === "teamLead"));
      setLoadingOptions(false);
    });

    if (isEdit && task) {
      setProjectId(task.projectId);
      setTaskName(task.name);
      setWorkedHours(String(task.workedHours));
      setAssigneeIds(task.assigneeIds);
      setStartDate(task.date);
      setDueDate(task.dueDate || "");
      setStatus(task.status);
      setBillingType(task.billingType ?? "billable");
      setError("");
      setActiveTab("details");
    } else {
      setProjectId(null);
      setTaskName("");
      setWorkedHours("0");
      setAssigneeIds([]);
      setStartDate(todayISO());
      setDueDate("");
      setStatus("Not Started");
      setBillingType("billable");
      setError("");
      setActiveTab("details");
    }
  }, [open, isEdit, task]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const hours = Number(workedHours) || 0;

    if (projectId == null || !taskName.trim() || !startDate) {
      setError(
        projectOptions.length === 0
          ? "No projects found. Please create a project before adding tasks."
          : "Project, task name and start date are required."
      );
      setActiveTab("details");
      return;
    }

    const project = projectOptions.find((p) => p.id === projectId);
    if (!project) {
      setError("Selected project not found.");
      setActiveTab("details");
      return;
    }

    const newTask: Task = {
      id: isEdit && task ? task.id : nextId,
      projectId: project.id,
      projectName: project.name,
      name: taskName.trim(),
      workedHours: hours,
      assigneeIds,
      date: startDate,
      dueDate: dueDate || undefined,
      status,
      billingType,
    };

    onSave(newTask);
    onClose();
  };

  const resetAndClose = () => {
    setError("");
    onClose();
  };

  const goNext = () => {
    if (activeTab === "details") {
      if (!projectId || !taskName) {
        setError("Please fill all required Details fields (*) before continuing.");
        return;
      }
      setError("");
      setActiveTab("time");
    } else if (activeTab === "time") {
      setError("");
      setActiveTab("people");
    }
  };

  const goBack = () => {
    if (activeTab === "time") setActiveTab("details");
    else if (activeTab === "people") setActiveTab("time");
  };

  const isFirstStep = activeTab === "details";
  const isLastStep = activeTab === "people";

  const getEmployeeName = (id: number) =>
    employeeOptions.find((e) => e.id === id)?.name ?? "Unknown";

  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "hsl(var(--background))",
      borderColor: state.isFocused
        ? "rgb(16 185 129)"
        : "hsl(var(--border))",
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
      color: "hsl(var(--muted-foreground))",
      fontSize: "0.875rem",
    }),
    multiValue: () => ({
      display: "none",
    }),
    input: (base: any) => ({
      ...base,
      color: "hsl(var(--foreground))",
      fontSize: "0.875rem",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: state.isFocused
        ? "rgb(16 185 129)"
        : "hsl(var(--muted-foreground))",
      paddingRight: "0.5rem",
      ":hover": {
        color: "rgb(16 185 129)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "hsl(var(--card))",
      borderRadius: "0.5rem",
      overflow: "hidden",
      border: "1px solid hsl(var(--border))",
      boxShadow:
        "0 10px 15px -3px rgba(15,23,42,0.25), 0 4px 6px -4px rgba(15,23,42,0.2)",
      zIndex: 50,
    }),
    menuList: (base: any) => ({
      ...base,
      paddingTop: 4,
      paddingBottom: 4,
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
      color: "hsl(var(--foreground))",
      cursor: "pointer",
    }),
  };

  type EmployeeOption = { value: number; label: string };
  const employeeSelectOptions: EmployeeOption[] = employeeOptions.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const selectedEmployeeOptions: EmployeeOption[] =
    employeeSelectOptions.filter((opt) => assigneeIds.includes(opt.value));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card text-foreground shadow-2xl border border-border max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Task" : "Add Task"}
          </h2>
          <button
            onClick={resetAndClose}
            className="h-7 w-7 rounded-full border border-border text-muted hover:bg-muted"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 bg-card/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${isActive
                  ? "text-emerald-500"
                  : "text-muted hover:text-foreground"
                  }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background"
        >
          {/* DETAILS TAB */}
          {activeTab === "details" && (
            <>
              {/* Project select */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Project<span className="text-red-500">*</span>
                </label>
                <select
                  value={projectId == null ? "" : String(projectId)}
                  onChange={(e) =>
                    setProjectId(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  required
                  disabled={projectOptions.length === 0}
                >
                  <option value="">
                    {projectOptions.length === 0
                      ? "No projects available. Add a project first."
                      : "Select project"}
                  </option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Task Name<span className="text-red-500">*</span>
                </label>
                <input
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Start Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    required
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </>
          )}

          {/* TIME TAB */}
          {activeTab === "time" && (
            <>
              {/* Billing type */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Billing type
                </label>
                <select
                  value={billingType}
                  onChange={(e) =>
                    setBillingType(e.target.value as TaskBillingType)
                  }
                  className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  <option value="billable">Billable</option>
                  <option value="non-billable">Non‑billable</option>
                </select>
                <p className="text-[11px] text-muted">
                  Billable hours are included in invoices; non‑billable are for
                  internal tracking only.
                </p>
              </div>

              {/* Worked hours */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Worked Hours
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  value={workedHours}
                  onChange={(e) => setWorkedHours(e.target.value)}
                  className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
                <p className="text-[11px] text-muted">
                  These hours will be used in the timesheet and billing
                  reports.
                </p>
              </div>
            </>
          )}

          {/* PEOPLE TAB */}
          {activeTab === "people" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Assigned to
              </label>
              <p className="text-[11px] text-muted">
                Select one or more employees who worked on this task.
              </p>

              {assigneeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {assigneeIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-500"
                    >
                      {getEmployeeName(id)}
                      <button
                        type="button"
                        onClick={() =>
                          setAssigneeIds((prev) =>
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
                value={selectedEmployeeOptions}
                onChange={(newValue) => {
                  const arr = (newValue as MultiValue<EmployeeOption>) ?? [];
                  const ids = arr.map((opt) => opt.value);
                  setAssigneeIds(ids);
                }}
                placeholder="Select employee(s)"
                classNamePrefix="react-select"
                styles={customSelectStyles}
                isClearable={false}
                components={{ ClearIndicator: () => null }}
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-card">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Back
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={goNext}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
              >
                Next
              </button>
            )}

            {isLastStep && (
              <button
                type="button"
                onClick={(e) => {
                  const form =
                    (e.currentTarget.parentElement
                      ?.parentElement?.previousElementSibling as HTMLFormElement) ||
                    null;
                  form?.requestSubmit();
                }}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
