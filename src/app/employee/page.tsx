import EmployeeDashboardShell from "@/components/EmployeeDashboardShell";

/**
 * Employee Dashboard Entry Page.
 * This is a Server Component that renders a Client Component Shell.
 * The Shell then dynamically imports the actual content with ssr: false,
 * which resolves the "Failed to load chunk" SSR error by ensuring the
 * heavy dashboard logic only runs in the browser.
 */
export default function EmployeeDashboardPage() {
  return <EmployeeDashboardShell />;
}
