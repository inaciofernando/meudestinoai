import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MinhasViagens from "./MinhasViagens";

export default function Viagens() {
  return (
    <ProtectedRoute>
      <PWALayout 
        showHeader={true}
        title="Minhas Viagens"
        subtitle="Gerencie todas as suas aventuras"
      >
        <MinhasViagens />
      </PWALayout>
    </ProtectedRoute>
  );
}