import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, Download, Trash2, ExternalLink, Save, Plus, Edit } from "lucide-react";
import { PWALayout } from "@/components/layout/PWALayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { cn } from "@/lib/utils";

interface Hotel {
  id: string;
  hotel_name: string;
  check_in_date: string;
  check_out_date: string;
  hotel_image_url?: string;
  voucher_file_url?: string;
  voucher_file_name?: string;
  hotel_link?: string;
  reservation_amount?: number;
  notes?: string;
}

interface HotelForm {
  hotel_name: string;
  check_in_date: Date | undefined;
  check_out_date: Date | undefined;
  hotel_image_url: string;
  voucher_file_url: string;
  voucher_file_name: string;
  hotel_link: string;
  reservation_amount: string;
  notes: string;
}

export default function Hotel() {
  const { id: tripId } = useParams();
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [newHotel, setNewHotel] = useState<HotelForm>({
    hotel_name: "",
    check_in_date: undefined,
    check_out_date: undefined,
    hotel_image_url: "",
    voucher_file_url: "",
    voucher_file_name: "",
    hotel_link: "",
    reservation_amount: "",
    notes: ""
  });

  useEffect(() => {
    if (tripId && user) {
      loadTripAndHotels();
    }
  }, [tripId, user]);

  const loadTripAndHotels = async () => {
    try {
      // Carregar dados da viagem
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Carregar hotéis
      await loadHotels();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da viagem');
    } finally {
      setLoading(false);
    }
  };

  const loadHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', user?.id);

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Erro ao carregar hotéis:', error);
      toast.error('Erro ao carregar hotéis');
    }
  };

  const resetForm = () => {
    setNewHotel({
      hotel_name: "",
      check_in_date: undefined,
      check_out_date: undefined,
      hotel_image_url: "",
      voucher_file_url: "",
      voucher_file_name: "",
      hotel_link: "",
      reservation_amount: "",
      notes: ""
    });
  };

  const handleEditHotel = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setNewHotel({
      hotel_name: hotel.hotel_name,
      check_in_date: new Date(hotel.check_in_date),
      check_out_date: new Date(hotel.check_out_date),
      hotel_image_url: hotel.hotel_image_url || "",
      voucher_file_url: hotel.voucher_file_url || "",
      voucher_file_name: hotel.voucher_file_name || "",
      hotel_link: hotel.hotel_link || "",
      reservation_amount: hotel.reservation_amount?.toString() || "",
      notes: hotel.notes || ""
    });
    setShowAddForm(true);
  };

  const handleSaveHotel = async () => {
    if (!user || !tripId) return;

    if (!newHotel.hotel_name || !newHotel.check_in_date || !newHotel.check_out_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const hotelData = {
        trip_id: tripId,
        user_id: user.id,
        hotel_name: newHotel.hotel_name,
        check_in_date: format(newHotel.check_in_date, 'yyyy-MM-dd'),
        check_out_date: format(newHotel.check_out_date, 'yyyy-MM-dd'),
        hotel_image_url: newHotel.hotel_image_url || null,
        voucher_file_url: newHotel.voucher_file_url || null,
        voucher_file_name: newHotel.voucher_file_name || null,
        hotel_link: newHotel.hotel_link || null,
        reservation_amount: newHotel.reservation_amount ? parseFloat(newHotel.reservation_amount) : null,
        notes: newHotel.notes || null
      };

      if (editingHotel) {
        // Atualizar hotel existente
        const { error } = await supabase
          .from('accommodations')
          .update(hotelData)
          .eq('id', editingHotel.id);

        if (error) throw error;
        toast.success('Hotel atualizado com sucesso!');
      } else {
        // Criar novo hotel
        const { error } = await supabase
          .from('accommodations')
          .insert([hotelData]);

        if (error) throw error;
        toast.success('Hotel adicionado com sucesso!');
      }

      setShowAddForm(false);
      setEditingHotel(null);
      resetForm();
      loadHotels();
    } catch (error) {
      console.error('Erro ao salvar hotel:', error);
      toast.error('Erro ao salvar hotel');
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingHotel(null);
    resetForm();
  };

  const handleDeleteHotel = async (hotelId: string) => {
    try {
      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', hotelId);

      if (error) throw error;

      toast.success('Hotel excluído com sucesso!');
      loadHotels();
    } catch (error) {
      console.error('Erro ao excluir hotel:', error);
      toast.error('Erro ao excluir hotel');
    }
  };

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
      setNewHotel({
        ...newHotel,
        voucher_file_url: result.url,
        voucher_file_name: result.fileName
      });
      toast.success('Voucher enviado com sucesso!');
    } else {
      toast.error('Erro ao enviar voucher');
    }
  };

  const handleDownloadVoucher = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Hotel</h1>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Hotel
          </Button>
        </div>

        {/* Formulário para adicionar novo hotel */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingHotel ? 'Editar Hotel' : 'Novo Hotel'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hotel_name">Nome do Hotel *</Label>
                <Input
                  id="hotel_name"
                  value={newHotel.hotel_name}
                  onChange={(e) => setNewHotel({ ...newHotel, hotel_name: e.target.value })}
                  placeholder="Digite o nome do hotel"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data de Check-in *</Label>
                  {trip?.start_date && trip?.end_date && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Período da viagem: {format(new Date(trip.start_date), "dd/MM/yyyy")} - {format(new Date(trip.end_date), "dd/MM/yyyy")}
                    </p>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newHotel.check_in_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newHotel.check_in_date ? format(newHotel.check_in_date, "dd/MM/yyyy") : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newHotel.check_in_date}
                        onSelect={(date) => setNewHotel({ ...newHotel, check_in_date: date })}
                        disabled={(date) => {
                          if (!trip?.start_date || !trip?.end_date) return false;
                          const startDate = new Date(trip.start_date);
                          const endDate = new Date(trip.end_date);
                          return date < startDate || date > endDate;
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Data de Check-out *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newHotel.check_out_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newHotel.check_out_date ? format(newHotel.check_out_date, "dd/MM/yyyy") : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newHotel.check_out_date}
                        onSelect={(date) => setNewHotel({ ...newHotel, check_out_date: date })}
                        disabled={(date) => {
                          if (!trip?.start_date || !trip?.end_date) return false;
                          const startDate = new Date(trip.start_date);
                          const endDate = new Date(trip.end_date);
                          return date < startDate || date > endDate || (newHotel.check_in_date && date <= newHotel.check_in_date);
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>Imagem do Hotel</Label>
                <ImageUpload
                  images={newHotel.hotel_image_url ? [newHotel.hotel_image_url] : []}
                  onImagesChange={(images) => setNewHotel({ ...newHotel, hotel_image_url: images[0] || "" })}
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
                  {newHotel.voucher_file_name && (
                    <span className="text-sm text-muted-foreground">{newHotel.voucher_file_name}</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="hotel_link">Link do Hotel</Label>
                <Input
                  id="hotel_link"
                  value={newHotel.hotel_link}
                  onChange={(e) => setNewHotel({ ...newHotel, hotel_link: e.target.value })}
                  placeholder="https://www.hotel.com"
                />
              </div>

              <div>
                <Label htmlFor="reservation_amount">Valor da Reserva (R$)</Label>
                <Input
                  id="reservation_amount"
                  type="number"
                  step="0.01"
                  value={newHotel.reservation_amount}
                  onChange={(e) => setNewHotel({ ...newHotel, reservation_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newHotel.notes}
                  onChange={(e) => setNewHotel({ ...newHotel, notes: e.target.value })}
                  placeholder="Observações sobre o hotel"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveHotel} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingHotel ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de hotéis */}
        <div className="grid gap-4">
          {hotels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">Nenhum hotel cadastrado</p>
                <Button onClick={() => setShowAddForm(true)}>
                  Adicionar Primeiro Hotel
                </Button>
              </CardContent>
            </Card>
          ) : (
            hotels.map((hotel) => (
              <Card key={hotel.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{hotel.hotel_name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditHotel(hotel)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteHotel(hotel.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Check-in:</strong> {format(new Date(hotel.check_in_date), "dd/MM/yyyy")}
                    </div>
                    <div>
                      <strong>Check-out:</strong> {format(new Date(hotel.check_out_date), "dd/MM/yyyy")}
                    </div>
                  </div>

                  {hotel.hotel_image_url && (
                    <div>
                      <strong>Imagem do Hotel:</strong>
                      <img
                        src={hotel.hotel_image_url}
                        alt="Hotel"
                        className="w-full h-48 object-cover rounded-lg mt-2"
                      />
                    </div>
                  )}

                  {hotel.voucher_file_url && (
                    <div className="flex items-center gap-2">
                      <strong>Voucher:</strong>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadVoucher(hotel.voucher_file_url!, hotel.voucher_file_name!)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {hotel.voucher_file_name}
                      </Button>
                    </div>
                  )}

                  {hotel.hotel_link && (
                    <div className="flex items-center gap-2">
                      <strong>Link do Hotel:</strong>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(hotel.hotel_link, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Acessar Site
                      </Button>
                    </div>
                  )}

                  {hotel.reservation_amount && (
                    <div>
                      <strong>Valor da Reserva:</strong> R$ {hotel.reservation_amount.toFixed(2)}
                    </div>
                  )}

                  {hotel.notes && (
                    <div>
                      <strong>Observações:</strong>
                      <p className="text-muted-foreground mt-1">{hotel.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PWALayout>
  );
}