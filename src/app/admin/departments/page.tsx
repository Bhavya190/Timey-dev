"use client";

import React, { useEffect, useState } from "react";
import {
    fetchDepartmentsAction,
    createDepartmentAction,
    updateDepartmentAction,
    deleteDepartmentAction
} from "@/app/actions";
import { Department } from "@/types";
import {
    Plus,
    Search,
    Building2,
    Users,
    MoreVertical,
    Pencil,
    Trash2,
    Eye,
    Loader2,
    X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const loadData = async () => {
        setLoading(true);
        const data = await fetchDepartmentsAction();
        setDepartments(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setName(dept.name);
            setDescription(dept.description || "");
        } else {
            setEditingDept(null);
            setName("");
            setDescription("");
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSaving(true);
        try {
            if (editingDept) {
                const result = await updateDepartmentAction(editingDept.id, { name, description });
                if ("error" in result) throw new Error(result.error as string);
                toast.success("Department updated successfully");
            } else {
                const result = await createDepartmentAction({ name, description });
                if ("error" in result) throw new Error(result.error as string);
                toast.success("Department created successfully");
            }
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this department? Employees in this department will be unlinked.")) return;

        try {
            const result = await deleteDepartmentAction(id);
            if ("error" in result) throw new Error(result.error as string);
            toast.success("Department removed");
            loadData();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Departments</h1>
                    <p className="text-sm text-muted">Manage your organization&apos;s structure and teams.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    Add Department
                </button>
            </div>

            {/* Stats / Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Building2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted font-medium">Total Departments</p>
                            <h3 className="text-xl font-bold">{departments.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Search departments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-full rounded-2xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((dept) => (
                        <div key={dept.id} className="group relative rounded-2xl border border-border bg-card p-5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                                    <Building2 className="h-6 w-6 text-emerald-500 group-hover:text-current" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(dept)} className="p-2 rounded-lg bg-background border border-border hover:text-emerald-500"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => handleDelete(dept.id)} className="p-2 rounded-lg bg-background border border-border hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-1">{dept.name}</h3>
                            <p className="text-sm text-muted line-clamp-2 mb-4 h-10">{dept.description || "No description provided."}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="flex items-center gap-2 text-xs text-muted">
                                    <Users className="h-3.5 w-3.5" />
                                    <span className="font-semibold text-foreground">{dept.employeeCount || 0}</span> Employees
                                </div>
                                <button
                                    onClick={() => router.push(`/admin/departments/${dept.id}`)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
                    <Building2 className="h-12 w-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No departments found</h3>
                    <p className="text-sm text-muted">Start by adding your first organization department.</p>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-border p-6">
                            <h2 className="text-xl font-bold">{editingDept ? "Edit Department" : "Add Department"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold">Department Name</label>
                                <input
                                    required
                                    placeholder="e.g. Engineering, Marketing..."
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold">Description (Optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief description of the department..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {editingDept ? "Update" : "Save"} Department
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
