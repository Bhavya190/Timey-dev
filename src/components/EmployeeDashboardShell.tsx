"use client";

import dynamic from "next/dynamic";

/**
 * A client-side-only wrapper for the employee dashboard content.
 * Isolating the dynamic(..., { ssr: false }) call here allows the
 * parent page to remain a Server Component if desired, while
 * ensuring the heavy dashboard logic never runs on the server.
 */
const EmployeeDashboardContent = dynamic(
    () => import("@/components/EmployeeDashboardContent"),
    {
        ssr: false,
        loading: () => (
            <main className="min-h-screen flex items-center justify-center bg-background text-muted">
                Loading dashboard...
            </main>
        ),
    }
);

export default function EmployeeDashboardShell({ currentEmployeeId }: { currentEmployeeId?: number }) {
    return <EmployeeDashboardContent currentEmployeeId={currentEmployeeId} />;
}
