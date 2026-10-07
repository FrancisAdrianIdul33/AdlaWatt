import AdminDashboardScreen from "@/admin/components/AdminDashboardScreen";

// Thin route wrapper — all UI lives in src/admin/ so the
// household dashboard stays untouched.
export default function AdminRoute() {
  return <AdminDashboardScreen />;
}
