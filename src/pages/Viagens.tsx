import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./Dashboard";

export default function Viagens() {
  return (
    <ProtectedRoute>
      <PWALayout 
        showHeader={true}
        title="Dashboard"
      >
        <Dashboard />
      </PWALayout>
    </ProtectedRoute>
  );
}