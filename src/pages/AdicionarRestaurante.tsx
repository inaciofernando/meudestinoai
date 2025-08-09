import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Save, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface RestaurantForm {
  restaurant_name: string;
  reservation_date: Date | undefined;
  reservation_time: string;
  restaurant_image_url: string;
  voucher_file_url: string;
  voucher_file_name: string;
  restaurant_link: string;
  tripadvisor_link: string;
  google_maps_link: string;
  waze_link: string;
  estimated_amount: string;
  cuisine_type: string;
  address: string;
  phone: string;
  notes: string;
}

export default function AdicionarRestaurante() {
  const { id: tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<RestaurantForm>({
    restaurant_name: "",
    reservation_date: undefined,
    reservation_time: "",
    restaurant_image_url: "",
    voucher_file_url: "",
    voucher_file_name: "",
    restaurant_link: "",
    tripadvisor_link: "",
    google_maps_link: "",
    waze_link: "",
    estimated_amount: "",
    cuisine_type: "",
    address: "",
    phone: "",
    notes: "",
  });

  // SEO basics for the page
  useEffect(() => {
    document.title = "Adicionar Restaurante | TravelManager";
    const desc = "Adicionar restaurante à viagem - formulário dedicado.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/viagem/${tripId}/restaurantes/novo`);
  }, [tripId]);

  useEffect(() => {
    const load = async () => {
      if (!tripId || !user) return;
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();
        if (error) throw error;
        setTrip(data);
      } catch (e) {
        toast.error('Erro ao carregar dados da viagem');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, user]);

  // Preenchimento via Concierge (query params)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nameFromConcierge = urlParams.get('name');
    const descriptionFromConcierge = urlParams.get('description');
    const cuisineFromConcierge = urlParams.get('cuisine');
    const addressFromConcierge = urlParams.get('address');
    const linkFromConcierge = urlParams.get('link');
    const tripadvisorFromConcierge = urlParams.get('tripadvisor');
    const gmapFromConcierge = urlParams.get('gmap');
    const wazeFromConcierge = urlParams.get('waze');
    const estimatedFromConcierge = urlParams.get('estimated_amount');
    const sourceText = urlParams.get('source') || '';
    const fromConcierge = urlParams.get('fromConcierge');

    console.log("🔍 Checking Concierge params for restaurant:", { 
      nameFromConcierge, 
      descriptionFromConcierge, 
      cuisineFromConcierge, 
      addressFromConcierge, 
      linkFromConcierge, 
      estimatedFromConcierge,
      fromConcierge,
      fullUrl: window.location.href 
    });

    let linkFromSource = '';
    if (sourceText) {
      const anyLink = sourceText.match(/https?:\/\/[^\s)]+/i);
      if (anyLink) linkFromSource = anyLink[0];
    }

    if (fromConcierge && (nameFromConcierge || descriptionFromConcierge || linkFromConcierge || linkFromSource)) {
      console.log("✅ Pre-filling restaurant form with concierge data", {
        nameFromConcierge,
        descriptionFromConcierge,
        cuisineFromConcierge,
        addressFromConcierge,
        linkFromConcierge,
        tripadvisorFromConcierge,
        gmapFromConcierge,
        wazeFromConcierge,
        estimatedFromConcierge,
        linkFromSource
      });
      setForm(prev => ({
        ...prev,
        restaurant_name: nameFromConcierge || prev.restaurant_name,
        notes: descriptionFromConcierge || prev.notes,
        cuisine_type: cuisineFromConcierge || prev.cuisine_type,
        address: addressFromConcierge || prev.address,
        restaurant_link: linkFromConcierge || linkFromSource || prev.restaurant_link,
        tripadvisor_link: tripadvisorFromConcierge ? tripadvisorFromConcierge.trim() : prev.tripadvisor_link,
        google_maps_link: gmapFromConcierge || prev.google_maps_link,
        waze_link: wazeFromConcierge || prev.waze_link,
        estimated_amount: estimatedFromConcierge || prev.estimated_amount,
      }));

      // Limpar os params da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const uploadVoucher = async (file: File): Promise<{ url: string; fileName: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `vouchers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('trip-documents')
        .getPublicUrl(filePath);

      return { url: data.publicUrl, fileName: file.name };
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  const handleVoucherUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadVoucher(file);
    if (result) {
      setForm({
        ...form,
        voucher_file_url: result.url,
        voucher_file_name: result.fileName,
      });
      toast.success('Voucher enviado com sucesso!');
    } else {
      toast.error('Erro ao enviar voucher');
    }
  };

  const save = async () => {
    if (!user || !tripId) return;
    if (!form.restaurant_name) {
      toast.error('Nome do restaurante é obrigatório');
      return;
    }

    try {
      const restaurantData = {
        trip_id: tripId,
        user_id: user.id,
        restaurant_name: form.restaurant_name,
        reservation_date: form.reservation_date ? format(form.reservation_date, 'yyyy-MM-dd') : null,
        reservation_time: form.reservation_time || null,
        restaurant_image_url: form.restaurant_image_url || null,
        voucher_file_url: form.voucher_file_url || null,
        voucher_file_name: form.voucher_file_name || null,
        restaurant_link: form.restaurant_link || null,
        tripadvisor_link: form.tripadvisor_link || null,
        google_maps_link: form.google_maps_link || null,
        waze_link: form.waze_link || null,
        estimated_amount: form.estimated_amount ? parseFloat(form.estimated_amount) : null,
        cuisine_type: form.cuisine_type || null,
        address: form.address || null,
        phone: form.phone || null,
        notes: form.notes || null,
      };

      const { error } = await supabase
        .from('restaurants')
        .insert([restaurantData]);

      if (error) throw error;
      toast.success('Restaurante adicionado com sucesso!');
      navigate(`/viagem/${tripId}/restaurantes`);
    } catch (error) {
      console.error('Erro ao salvar restaurante:', error);
      toast.error('Erro ao salvar restaurante');
    }
  };

  if (loading) {
    return (
      <PWALayout>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PWALayout>
    );
  }

  return (
    <PWALayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Novo Restaurante</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar Restaurante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="restaurant_name">Nome do Restaurante *</Label>
              <Input
                id="restaurant_name"
                value={form.restaurant_name}
                onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
                placeholder="Digite o nome do restaurante"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data da Reserva</Label>
                {trip?.start_date && trip?.end_date && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Período da viagem: {format(parseISO(trip.start_date), "dd/MM/yyyy")} - {format(parseISO(trip.end_date), "dd/MM/yyyy")}
                  </p>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.reservation_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.reservation_date ? format(form.reservation_date, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.reservation_date}
                      onSelect={(date) => setForm({ ...form, reservation_date: date })}
                      disabled={(date) => {
                        if (!trip?.start_date || !trip?.end_date) return false;
                        const startDate = parseISO(trip.start_date);
                        const endDate = parseISO(trip.end_date);
                        return date < startDate || date > endDate;
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="reservation_time">Horário da Reserva</Label>
                <Input
                  id="reservation_time"
                  type="time"
                  value={form.reservation_time}
                  onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cuisine_type">Tipo de Culinária</Label>
              <Input
                id="cuisine_type"
                value={form.cuisine_type}
                onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })}
                placeholder="Ex: Italiana, Japonesa, Brasileira"
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Endereço do restaurante"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label>Imagem do Restaurante</Label>
              <ImageUpload
                images={form.restaurant_image_url ? [form.restaurant_image_url] : []}
                onImagesChange={(images) => setForm({ ...form, restaurant_image_url: images[0] || "" })}
                maxImages={1}
              />
            </div>

            <div>
              <Label htmlFor="voucher">Voucher</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="voucher"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleVoucherUpload}
                  className="cursor-pointer"
                />
                {form.voucher_file_name && (
                  <span className="text-sm text-muted-foreground">{form.voucher_file_name}</span>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="restaurant_link">Link do Restaurante (site oficial)</Label>
              <Input
                id="restaurant_link"
                value={form.restaurant_link}
                onChange={(e) => setForm({ ...form, restaurant_link: e.target.value })}
                placeholder="https://www.restaurante.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tripadvisor_link">Tripadvisor</Label>
                <Input
                  id="tripadvisor_link"
                  value={form.tripadvisor_link}
                  onChange={(e) => setForm({ ...form, tripadvisor_link: e.target.value })}
                  placeholder="https://www.tripadvisor.com/..."
                />
              </div>
              <div>
                <Label htmlFor="google_maps_link">Google Maps</Label>
                <Input
                  id="google_maps_link"
                  value={form.google_maps_link}
                  onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div>
                <Label htmlFor="waze_link">Waze</Label>
                <Input
                  id="waze_link"
                  value={form.waze_link}
                  onChange={(e) => setForm({ ...form, waze_link: e.target.value })}
                  placeholder="https://waze.com/ul?..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimated_amount">Valor Estimado (R$)</Label>
              <Input
                id="estimated_amount"
                type="number"
                step="0.01"
                value={form.estimated_amount}
                onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observações sobre o restaurante"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={save} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Salvar
              </Button>
              <Button variant="outline" onClick={() => navigate(`/viagem/${tripId}/restaurantes`)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PWALayout>
  );
}
