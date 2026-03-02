import TrashDashboard from "@/components/TrashDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trash | Admin",
  description: "View and recover deleted items.",
};

export default function AdminTrashPage() {
  return <TrashDashboard />;
}
