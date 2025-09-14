import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Viagens() {
  const navigate = useNavigate();
  
  return (
    <ProtectedRoute>
      <PWALayout 
        showHeader={true}
        title="Dashboard"
        subtitle="Bem-vindo de volta! Aqui está o resumo das suas viagens"
        actions={
          <Button 
            variant="outline" 
            size="icon"
            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
            onClick={() => navigate("/nova-viagem")}
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      >
        <Dashboard />
      </PWALayout>
    </ProtectedRoute>
  );
}