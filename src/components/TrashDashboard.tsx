"use client";

import { useEffect, useState } from "react";
import { fetchTrashAction, restoreTrashAction, hardDeleteTrashAction } from "@/app/actions";
import { formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import toast from "react-hot-toast";
import { Trash2, RefreshCw, AlertTriangle } from "lucide-react";

export default function TrashDashboard() {
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTrash() {
    try {
      setLoading(true);
      const items = await fetchTrashAction();
      setTrashItems(items);
    } catch (error: any) {
      toast.error(error.message || "Failed to load trash");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrash();
  }, []);

  async function handleRestore(id: number) {
    try {
      await restoreTrashAction(id);
      toast.success("Item restored successfully");
      loadTrash();
    } catch (error: any) {
      toast.error(error.message || "Failed to restore item");
    }
  }

  async function handleHardDelete(id: number) {
    if (!confirm("Are you sure? This action cannot be undone and will permanently delete the item.")) return;
    try {
      await hardDeleteTrashAction(id);
      toast.success("Item permanently deleted");
      loadTrash();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted">Loading trash...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-emerald-500" />
          Trash
        </h1>
        <p className="text-sm text-muted">Items here will be permanently deleted after 30 days.</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 font-medium text-muted">Type</th>
                <th className="px-6 py-3 font-medium text-muted">Name/Identifier</th>
                <th className="px-6 py-3 font-medium text-muted">Deleted</th>
                <th className="px-6 py-3 font-medium text-muted">Expires In</th>
                <th className="px-6 py-3 font-medium text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trashItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted">
                    Trash is empty
                  </td>
                </tr>
              ) : (
                trashItems.map((item) => {
                  const data = item.entityData;
                  const identifier = data.name || data.code || (data.firstName ? `${data.firstName} ${data.lastName}` : "Unknown");
                  const deletedDate = parseISO(item.createdAt);
                  const daysLeft = 30 - differenceInDays(new Date(), deletedDate);

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{item.entityType}</td>
                      <td className="px-6 py-4">{identifier}</td>
                      <td className="px-6 py-4 text-muted">
                        {formatDistanceToNow(deletedDate, { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${daysLeft <= 3 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {Math.max(0, daysLeft)} days
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="p-1.5 text-muted hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                            title="Restore"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleHardDelete(item.id)}
                            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Delete Permanently"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
