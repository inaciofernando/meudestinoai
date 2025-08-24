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
import { cn } from "@/lib/utils";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    day_number: 1,
    time_start: "08:00",
    time_end: "09:00",
    title: "",
    description: "",
    location: "",
    address: "",
    website_link: "",
    tripadvisor_link: "",
    google_maps_link: "",
    waze_link: "",
    category: "activity",
    images: [] as string[],
    vouchers: [] as Array<{
      url: string;
      name: string;
      type: string;
      description?: string;
    }>,
    is_all_day: false
  });

  // Função para adicionar uma hora a um horário
  const addOneHour = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Função para validar se hora fim é maior que hora início
  const isEndTimeValid = (startTime: string, endTime: string): boolean => {
    if (!endTime) return true; // hora fim é opcional
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return endTotalMinutes > startTotalMinutes;
  };

  // Função para lidar com mudança na hora início
  const handleStartTimeChange = (newStartTime: string) => {
    const currentEndTime = formData.time_end;
    let newEndTime = currentEndTime;
    
    // Se não há hora fim ou se a hora fim atual seria inválida, ajustar para uma hora depois
    if (!currentEndTime || !isEndTimeValid(newStartTime, currentEndTime)) {
      newEndTime = addOneHour(newStartTime);
    }
    
    setFormData(prev => ({
      ...prev, 
      time_start: newStartTime,
      time_end: newEndTime
    }));
  };

  // Função para lidar com mudança na hora fim
  const handleEndTimeChange = (newEndTime: string) => {
    setFormData(prev => ({
      ...prev, 
      time_end: newEndTime
    }));
  };

  // Função para lidar com mudança da opção "Dia todo"
  const handleAllDayChange = (isAllDay: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_all_day: isAllDay,
      time_start: isAllDay ? "" : "08:00",
      time_end: isAllDay ? "" : "09:00"
    }));
  };

  // Função para gerar os dias da viagem com datas reais e timezone fix
  const getTripDays = () => {
    if (!trip?.start_date || !trip?.end_date) return [];
    
    try {
      // Usar parseISO para evitar problemas de timezone
      const startDate = parseISO(trip.start_date);
      const endDate = parseISO(trip.end_date);
      const days = [];
      
      for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
        const dayNumber = Math.ceil((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const formattedDate = format(d, "dd/MM/yyyy");
        const weekday = format(d, "EEEE", { locale: ptBR }).substring(0, 3).toUpperCase();
        
        days.push({
          value: dayNumber,
          label: `${formattedDate} - ${weekday}`,
          date: formattedDate
        });
      }
      
      return days;
    } catch (error) {
      console.error("Erro ao gerar dias da viagem:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!user?.id || !pontoId || !tripId) return;
    
    const fetchData = async () => {
      try {
        // Buscar ponto e viagem em paralelo
        const [pontoResponse, tripResponse] = await Promise.all([
          supabase
            .from("roteiro_pontos")
            .select("*")
            .eq("id", pontoId)
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("trips")
            .select("start_date, end_date, title")
            .eq("id", tripId)
            .eq("user_id", user.id)
            .single()
        ]);

        if (pontoResponse.error) {
          console.error("Erro ao buscar ponto:", pontoResponse.error);
          navigate(`/roteiro/${tripId}`);
          return;
        }

        if (tripResponse.error) {
          console.error("Erro ao buscar viagem:", tripResponse.error);
          navigate(`/roteiro/${tripId}`);
          return;
        }

        // Parse voucher_files se existir e converter para o tipo correto
        const voucherFiles = pontoResponse.data.voucher_files;
        const parsedVoucherFiles = Array.isArray(voucherFiles) 
          ? voucherFiles as Array<{ url: string; name: string; type: string; description?: string; }>
          : [];

        const pontoData: RoteiroPonto = {
          id: pontoResponse.data.id,
          roteiro_id: pontoResponse.data.roteiro_id,
          day_number: pontoResponse.data.day_number,
          time_start: pontoResponse.data.time_start,
          time_end: pontoResponse.data.time_end || undefined,
          title: pontoResponse.data.title,
          description: pontoResponse.data.description || undefined,
          location: pontoResponse.data.location,
          category: pontoResponse.data.category,
          order_index: pontoResponse.data.order_index,
          images: pontoResponse.data.images || [],
          voucher_files: parsedVoucherFiles
        };

        setPonto(pontoData);
        setTrip(tripResponse.data);
        setFormData({
          day_number: pontoResponse.data.day_number,
          time_start: pontoResponse.data.time_start,
          time_end: pontoResponse.data.time_end || "",
          title: pontoResponse.data.title,
          description: pontoResponse.data.description || "",
          location: pontoResponse.data.location,
          address: pontoResponse.data.address || "",
          website_link: pontoResponse.data.website_link || "",
          tripadvisor_link: pontoResponse.data.tripadvisor_link || "",
          google_maps_link: pontoResponse.data.google_maps_link || "",
          waze_link: pontoResponse.data.waze_link || "",
          category: pontoResponse.data.category,
          images: pontoResponse.data.images || [],
          vouchers: parsedVoucherFiles,
          is_all_day: false
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          time_start: formData.is_all_day ? "00:00" : formData.time_start,
          time_end: formData.is_all_day ? "23:59" : (formData.time_end || null),
          title: formData.title,
          description: formData.description,
          location: formData.location,
          address: formData.address || null,
          website_link: formData.website_link || null,
          tripadvisor_link: formData.tripadvisor_link || null,
          google_maps_link: formData.google_maps_link || null,
          waze_link: formData.waze_link || null,
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
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {CATEGORIES.map((cat) => (
                      <SelectItem 
                        key={cat.value} 
                        value={cat.value}
                        className="hover:bg-muted focus:bg-muted cursor-pointer"
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dia e Horários */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="day-select">Dia</Label>
                    <Select
                      value={formData.day_number.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, day_number: parseInt(value) }))}
                    >
                      <SelectTrigger id="day-select" className="bg-background">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
                        {getTripDays().map((day) => (
                          <SelectItem 
                            key={day.value} 
                            value={day.value.toString()}
                            className="hover:bg-muted focus:bg-muted cursor-pointer"
                          >
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="all-day"
                      checked={formData.is_all_day}
                      onChange={(e) => handleAllDayChange(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="all-day">Dia todo</Label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="start-time">Início</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={formData.time_start}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      disabled={formData.is_all_day}
                      className={formData.is_all_day ? "bg-muted" : ""}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="end-time">Fim</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={formData.time_end}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      disabled={formData.is_all_day}
                      className={formData.is_all_day ? "bg-muted" : ""}
                    />
                  </div>
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
                   rows={6}
                   className="min-h-[140px]"
                 />
               </div>

               {/* Endereço */}
               <div className="space-y-2">
                 <Label htmlFor="address">Endereço</Label>
                 <Input
                   id="address"
                   value={formData.address}
                   onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                   placeholder="Endereço completo do local"
                 />
               </div>

               {/* Site Oficial */}
               <div className="space-y-2">
                 <Label htmlFor="website_link">Site Oficial</Label>
                 <Input
                   id="website_link"
                   value={formData.website_link}
                   onChange={(e) => setFormData(prev => ({ ...prev, website_link: e.target.value }))}
                   placeholder="https://www.site.com"
                 />
               </div>

               {/* Links em Grid */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="tripadvisor_link">TripAdvisor</Label>
                   <Input
                     id="tripadvisor_link"
                     value={formData.tripadvisor_link}
                     onChange={(e) => setFormData(prev => ({ ...prev, tripadvisor_link: e.target.value }))}
                     placeholder="https://www.tripadvisor.com/..."
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="google_maps_link">Google Maps</Label>
                   <Input
                     id="google_maps_link"
                     value={formData.google_maps_link}
                     onChange={(e) => setFormData(prev => ({ ...prev, google_maps_link: e.target.value }))}
                     placeholder="https://maps.google.com/..."
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="waze_link">Waze</Label>
                   <Input
                     id="waze_link"
                     value={formData.waze_link}
                     onChange={(e) => setFormData(prev => ({ ...prev, waze_link: e.target.value }))}
                     placeholder="https://waze.com/ul?..."
                   />
                 </div>
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