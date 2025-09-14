import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MinhasViagens from "./MinhasViagens";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MinhasViagensWrapper() {
  const navigate = useNavigate();
  
  return (
    <ProtectedRoute>
      <PWALayout 
        showHeader={true}
        title="Minhas Viagens"
        subtitle="Gerencie todas as suas aventuras"
        actions={
          <Button variant="travel" size="sm" className="gap-2" onClick={() => navigate('/nova-viagem')}>
            <Plus className="w-4 h-4" />
            Nova
          </Button>
        }
      >
        <MinhasViagens />
      </PWALayout>
    </ProtectedRoute>
  );
}