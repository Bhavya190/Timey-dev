"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/lib/employees";
import {
  fetchAdminEmployeesAction,
  createEmployeeAction,
  deleteEmployeeAction,
  updateEmployeeProfileAction,
} from "@/app/actions";
import { ChevronUp, ChevronDown } from "lucide-react";
import AddEmployeeModal from "@/components/AddEmployeeModal";

function AvatarCircle({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: Employee["status"] }) {
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

export default function AdminEmployees() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchAdminEmployeesAction().then((data) => {
      setEmployees(data);
      setIsLoading(false);
    });
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Employee | "name";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  const handleRowClick = (id: number) => {
    router.push(`/admin/employees/${id}`);
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleRemove = async (id: number) => {
    try {
      await deleteEmployeeAction(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to delete employee:", err);
      alert("Failed to delete employee. Please try again.");
    }
  };

  const handleView = (emp: Employee) => {
    router.push(`/admin/employees/${emp.id}`);
    setOpenMenuId(null);
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setModalMode("edit");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleAddEmployeeClick = () => {
    setSelectedEmployee(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (empData: any) => {
    try {
      if (modalMode === "add") {
        const created: any = await createEmployeeAction(empData);
        if (created.error) {
          alert(created.error);
          return;
        }
        
        if (!created.emailSent) {
          alert(`Employee created successfully, but the invitation email failed to send! (Check SMTP settings).\n\nTemporary Password: ${created.tempPassword}\n\nPlease share this password with the employee manually.`);
        } else {
          alert(`Employee created successfully! An invitation email with their temporary password has been sent to ${created.email}.`);
        }
        // Map to summary type for UI (handling both camelCase and snake_case API returns)
        const summary: Employee = {
          id: created.id,
          name: `${created.firstName || created.first_name} ${created.lastName || created.last_name}`,
          firstName: created.firstName || created.first_name,
          middleName: created.middleName || created.middle_name || undefined,
          lastName: created.lastName || created.last_name,
          email: created.email,
          department: created.department,
          location: created.location,
          code: created.code,
          status: "Active",
          role: created.role,
          shift: created.shift,
          address: created.address,
          city: created.city,
          stateRegion: created.stateRegion || created.state_region,
          country: created.country,
          zip: created.zip,
          phone: created.phone,
          hireDate: created.hireDate || created.hire_date,
          terminationDate: created.terminationDate || created.termination_date || undefined,
          workType: created.workType || created.work_type,
          billingType: created.billingType || created.billing_type,
          employeeRate: created.employeeRate || created.employee_rate,
          employeeCurrency: created.employeeCurrency || created.employee_currency,
          billingRateType: created.billingRateType || created.billing_rate_type,
          billingCurrency: created.billingCurrency || created.billing_currency,
          billingStart: created.billingStart || created.billing_start,
          billingEnd: created.billingEnd || created.billing_end || undefined,
        };
        setEmployees((prev) => [...prev, summary]);
      } else {
        if (!selectedEmployee) return;
        const updated: any = await updateEmployeeProfileAction(selectedEmployee.id, empData);
        if (updated.error) {
          alert(updated.error);
          return;
        }
        const summary: Employee = {
          id: updated.id,
          name: `${updated.firstName} ${updated.lastName}`,
          firstName: updated.firstName,
          middleName: updated.middleName || undefined,
          lastName: updated.lastName,
          email: updated.email,
          department: updated.department,
          location: updated.location,
          code: updated.code,
          status: "Active",
          role: updated.role,
          shift: updated.shift,
          address: updated.address,
          city: updated.city,
          stateRegion: updated.stateRegion,
          country: updated.country,
          zip: updated.zip,
          phone: updated.phone,
          hireDate: updated.hireDate,
          terminationDate: updated.terminationDate || undefined,
          workType: updated.workType,
          billingType: updated.billingType,
          employeeRate: updated.employeeRate,
          employeeCurrency: updated.employeeCurrency,
          billingRateType: updated.billingRateType,
          billingCurrency: updated.billingCurrency,
          billingStart: updated.billingStart,
          billingEnd: updated.billingEnd || undefined,
        };
        setEmployees((prev) =>
          prev.map((e) => (e.id === summary.id ? summary : e))
        );
      }
      setIsModalOpen(false);
      setSelectedEmployee(null);
    } catch (err: any) {
      console.error("Failed to save employee:", err);
      alert(err.message || "Failed to save employee. Please try again.");
    }
  };

  const handleSort = (key: keyof Employee | "name") => {
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

  const nextCode = String(employees.length + 1).padStart(3, "0");

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let items = employees.filter((emp) => {
      const matchesSearch =
        !term ||
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.code.toLowerCase().includes(term);

      return matchesSearch;
    });

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = String((a as any)[sortConfig.key] ?? "");
        const bVal = String((b as any)[sortConfig.key] ?? "");
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [employees, searchTerm, sortConfig]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted">
            All registered employees visible to the admin.
          </p>
        </div>

        <button
          onClick={handleAddEmployeeClick}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
        >
          + Add Employee
        </button>
      </div>

      {/* Container */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-medium text-foreground">
              {filteredEmployees.length}
            </span>
            <span>employees</span>
            {searchTerm ? (
              <span className="text-[11px] text-muted">
                (filtered from {employees.length})
              </span>
            ) : null}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, code..."
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
                    Employee <SortIcon column="name" />
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
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    Email <SortIcon column="email" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium hidden lg:table-cell cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("department")}
                >
                  <div className="flex items-center gap-1">
                    Department <SortIcon column="department" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium hidden lg:table-cell cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("location")}
                >
                  <div className="flex items-center gap-1">
                    Location <SortIcon column="location" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-background/60 cursor-pointer"
                  onClick={() => handleRowClick(emp.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={emp.name} />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {emp.name}
                        </p>
                        <p className="text-[11px] text-muted lg:hidden">
                          {emp.department}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {emp.code}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <span className="font-mono text-[11px] sm:text-xs">
                      {emp.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted">
                    {emp.department}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted">
                    {emp.location}
                  </td>
                  <td
                    className="relative px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => toggleMenu(emp.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-card"
                    >
                      ⋮
                    </button>

                    {openMenuId === emp.id && (
                      <div className="absolute right-4 top-11 z-10 w-40 rounded-lg border border-border bg-card text-xs shadow-lg">
                        <button
                          onClick={() => handleView(emp)}
                          className="block w-full px-3 py-2 text-left hover:bg-background/70"
                        >
                          View details
                        </button>
                        <button
                          onClick={() => handleEdit(emp)}
                          className="block w-full px-3 py-2 text-left hover:bg-background/70"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemove(emp.id)}
                          className="block w-full px-3 py-2 text-left text-red-500 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {(filteredEmployees.length === 0 && !isLoading) && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    No employees found.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    Loading employees...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit employee modal */}
      <AddEmployeeModal
        open={isModalOpen}
        mode={modalMode}
        employee={selectedEmployee}
        nextCode={nextCode}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
      />
    </div>
  );
}
