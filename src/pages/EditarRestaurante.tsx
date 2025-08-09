import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PWALayout } from "@/components/layout/PWALayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowLeft, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

export default function EditarRestaurante() {
  const { id: tripId, restId } = useParams<{ id: string; restId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !tripId || !restId) return;
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restId)
          .eq("trip_id", tripId)
          .eq("user_id", user.id)
          .single();
        if (error) throw error;
        setForm({
          restaurant_name: data.restaurant_name,
          reservation_date: data.reservation_date ? parseISO(data.reservation_date) : undefined,
          reservation_time: data.reservation_time || "",
          restaurant_image_url: data.restaurant_image_url || "",
          voucher_file_url: data.voucher_file_url || "",
          voucher_file_name: data.voucher_file_name || "",
          restaurant_link: data.restaurant_link || "",
          tripadvisor_link: data.tripadvisor_link || "",
          google_maps_link: data.google_maps_link || "",
          waze_link: data.waze_link || "",
          estimated_amount: data.estimated_amount ? String(data.estimated_amount) : "",
          cuisine_type: data.cuisine_type || "",
          address: data.address || "",
          phone: data.phone || "",
          notes: data.notes || "",
        });
      } catch (e) {
        console.error(e);
        toast.error("Não foi possível carregar o restaurante");
        navigate(`/viagem/${tripId}/restaurantes`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, tripId, restId]);

  const uploadVoucher = async (file: File): Promise<{ url: string; fileName: string } | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `vouchers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("trip-documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from("trip-documents")
        .getPublicUrl(filePath);

      return { url: data.publicUrl, fileName: file.name };
    } catch (error) {
      console.error("Erro no upload:", error);
      return null;
    }
  };

  const handleVoucherUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadVoucher(file);
    if (result) {
      setForm({ ...form, voucher_file_url: result.url, voucher_file_name: result.fileName });
      toast.success("Voucher enviado com sucesso!");
    } else {
      toast.error("Erro ao enviar voucher");
    }
  };

  const save = async () => {
    if (!user?.id || !tripId || !restId) return;
    if (!form.restaurant_name) {
      toast.error("Nome do restaurante é obrigatório");
      return;
    }
    try {
      const payload = {
        restaurant_name: form.restaurant_name,
        reservation_date: form.reservation_date ? format(form.reservation_date, "yyyy-MM-dd") : null,
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
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("restaurants")
        .update(payload)
        .eq("id", restId)
        .eq("trip_id", tripId)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Restaurante atualizado!");
      navigate(`/viagem/${tripId}/restaurantes`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar restaurante");
    }
  };

  if (loading) {
    return (
      <PWALayout>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PWALayout>
    );
  }

  return (
    <PWALayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/viagem/${tripId}/restaurantes`)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">Editar Restaurante</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="restaurant_name">Nome do Restaurante *</Label>
              <Input id="restaurant_name" value={form.restaurant_name} onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data da Reserva</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !form.reservation_date && "text-muted-foreground")}
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
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="reservation_time">Horário da Reserva</Label>
                <Input id="reservation_time" type="time" value={form.reservation_time} onChange={(e) => setForm({ ...form, reservation_time: e.target.value })} />
              </div>
            </div>

            <div>
              <Label htmlFor="cuisine_type">Tipo de Culinária</Label>
              <Input id="cuisine_type" value={form.cuisine_type} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div>
              <Label>Imagem do Restaurante</Label>
              <ImageUpload images={form.restaurant_image_url ? [form.restaurant_image_url] : []} onImagesChange={(imgs) => setForm({ ...form, restaurant_image_url: imgs[0] || "" })} maxImages={1} />
            </div>

            <div>
              <Label htmlFor="voucher">Voucher</Label>
              <Input id="voucher" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleVoucherUpload} className="cursor-pointer" />
              {form.voucher_file_name && <p className="text-xs text-muted-foreground mt-1">{form.voucher_file_name}</p>}
            </div>

            <div>
              <Label htmlFor="restaurant_link">Link do Restaurante (site oficial)</Label>
              <Input id="restaurant_link" value={form.restaurant_link} onChange={(e) => setForm({ ...form, restaurant_link: e.target.value })} placeholder="https://www.restaurante.com" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tripadvisor_link">Tripadvisor</Label>
                <Input id="tripadvisor_link" value={form.tripadvisor_link} onChange={(e) => setForm({ ...form, tripadvisor_link: e.target.value })} placeholder="https://www.tripadvisor.com/..." />
              </div>
              <div>
                <Label htmlFor="google_maps_link">Google Maps</Label>
                <Input id="google_maps_link" value={form.google_maps_link} onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })} placeholder="https://maps.google.com/..." />
              </div>
              <div>
                <Label htmlFor="waze_link">Waze</Label>
                <Input id="waze_link" value={form.waze_link} onChange={(e) => setForm({ ...form, waze_link: e.target.value })} placeholder="https://waze.com/ul?..." />
              </div>
            </div>

            <div>
              <Label htmlFor="estimated_amount">Valor Estimado (R$)</Label>
              <Input id="estimated_amount" type="number" step="0.01" value={form.estimated_amount} onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })} placeholder="0.00" />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações sobre o restaurante" />
            </div>

            <div className="flex gap-2">
              <Button onClick={save} className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvar alterações
              </Button>
              <Button variant="outline" onClick={() => navigate(`/viagem/${tripId}/restaurantes`)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PWALayout>
  );
}
