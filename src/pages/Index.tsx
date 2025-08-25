import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./Dashboard";

export default function Index() {
  return (
    <ProtectedRoute>
      <PWALayout showHeader={true}>
        <Dashboard />
      </PWALayout>
    </ProtectedRoute>
  );
}
