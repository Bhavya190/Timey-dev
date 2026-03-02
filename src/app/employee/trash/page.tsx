import TrashDashboard from "@/components/TrashDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trash | Employee",
  description: "View and recover deleted items.",
};

export default function EmployeeTrashPage() {
  return <TrashDashboard />;
}
