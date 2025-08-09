import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Clock } from "lucide-react";
import { ItineraryImageUpload } from "@/components/ItineraryImageUpload";
import { VoucherUpload } from "@/components/VoucherUpload";

interface RoteiroPonto {
  id: string;
  roteiro_id: string;
  day_number: number;
  time_start: string;
  time_end?: string;
  title: string;
  description?: string;
  location: string;
  category: string;
  order_index: number;
  images?: string[];
  voucher_files?: Array<{
    url: string;
    name: string;
    type: string;
    description?: string;
  }>;
}

const CATEGORIES = [
  { value: "food", label: "Alimentação" },
  { value: "transport", label: "Transporte" },
  { value: "accommodation", label: "Hospedagem" },
  { value: "attraction", label: "Atração" },
  { value: "activity", label: "Atividade" }
];

export default function EditarPonto() {
  const { tripId, pontoId } = useParams<{ tripId: string; pontoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ponto, setPonto] = useState<RoteiroPonto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    day_number: 1,
    time_start: "09:00",
    time_end: "",
    title: "",
    description: "",
    location: "",
    category: "activity",
    images: [] as string[],
    vouchers: [] as Array<{
      url: string;
      name: string;
      type: string;
      description?: string;
    }>
  });

  useEffect(() => {
    if (!user?.id || !pontoId) return;
    
    const fetchPonto = async () => {
      try {
        const { data, error } = await supabase
          .from("roteiro_pontos")
          .select("*")
          .eq("id", pontoId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Erro ao buscar ponto:", error);
          navigate(`/roteiro/${tripId}`);
          return;
        }

        // Parse voucher_files se existir e converter para o tipo correto
        const voucherFiles = data.voucher_files;
        const parsedVoucherFiles = Array.isArray(voucherFiles) 
          ? voucherFiles as Array<{ url: string; name: string; type: string; description?: string; }>
          : [];

        const pontoData: RoteiroPonto = {
          id: data.id,
          roteiro_id: data.roteiro_id,
          day_number: data.day_number,
          time_start: data.time_start,
          time_end: data.time_end || undefined,
          title: data.title,
          description: data.description || undefined,
          location: data.location,
          category: data.category,
          order_index: data.order_index,
          images: data.images || [],
          voucher_files: parsedVoucherFiles
        };

        setPonto(pontoData);
        setFormData({
          day_number: data.day_number,
          time_start: data.time_start,
          time_end: data.time_end || "",
          title: data.title,
          description: data.description || "",
          location: data.location,
          category: data.category,
          images: data.images || [],
          vouchers: parsedVoucherFiles
        });
      } catch (error) {
        console.error("Erro ao carregar ponto:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do ponto.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPonto();
  }, [user?.id, pontoId, tripId, navigate, toast]);

  const handleSave = async () => {
    if (!ponto || !user?.id || !formData.title || !formData.location) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o título e local do ponto.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("roteiro_pontos")
        .update({
          day_number: formData.day_number,
          time_start: formData.time_start,
          time_end: formData.time_end || null,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          category: formData.category,
          images: formData.images,
          voucher_files: formData.vouchers
        })
        .eq("id", ponto.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Ponto atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      navigate(`/roteiro/${tripId}/ponto/${pontoId}`);
    } catch (error) {
      console.error("Erro ao atualizar ponto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleVouchersChange = (vouchers: Array<{ url: string; name: string; type: string; description?: string; }>) => {
    setFormData(prev => ({ ...prev, vouchers }));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout showFooter={false}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Carregando...</p>
            </div>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!ponto) {
    return (
      <ProtectedRoute>
        <PWALayout showFooter={false}>
          <div className="text-center py-12">
            <p>Ponto não encontrado</p>
            <Button onClick={() => navigate(`/roteiro/${tripId}`)} className="mt-4">
              Voltar ao roteiro
            </Button>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout showFooter={false}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/roteiro/${tripId}/ponto/${pontoId}`)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Editar Ponto</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Ponto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome do local ou atividade"
                />
              </div>

              {/* Local */}
              <div className="space-y-2">
                <Label htmlFor="location">Local *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Endereço ou nome do local"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dia e Horários */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="day">Dia</Label>
                  <Input
                    id="day"
                    type="number"
                    min="1"
                    value={formData.day_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, day_number: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Horário Início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.time_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, time_start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Horário Fim</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.time_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, time_end: e.target.value }))}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição detalhada do local ou atividade"
                  rows={3}
                />
              </div>

              {/* Upload de imagens */}
              <div className="space-y-2">
                <Label>Imagens</Label>
                <ItineraryImageUpload
                  images={formData.images}
                  onImagesChange={handleImagesChange}
                />
              </div>

              {/* Upload de vouchers */}
              <div className="space-y-2">
                <Label>Vouchers e Documentos</Label>
                <VoucherUpload
                  vouchers={formData.vouchers}
                  onVouchersChange={handleVouchersChange}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/roteiro/${tripId}/ponto/${pontoId}`)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PWALayout>
    </ProtectedRoute>
  );
}