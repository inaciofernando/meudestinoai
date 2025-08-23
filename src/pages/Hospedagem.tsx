import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Upload, Download, Trash2, ExternalLink, Save, Plus, Edit, ArrowLeft } from "lucide-react";
import { PWALayout } from "@/components/layout/PWALayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { cn, formatCurrency } from "@/lib/utils";
import TripSectionHeader from "@/components/TripSectionHeader";

interface Accommodation {
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

interface AccommodationForm {
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

export default function Hospedagem() {
  const { id: tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null);
  const [newAccommodation, setNewAccommodation] = useState<AccommodationForm>({
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
      loadTripAndAccommodations();
    }
  }, [tripId, user]);

  const loadTripAndAccommodations = async () => {
    try {
      // Carregar dados da viagem
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Carregar hospedagens
      await loadAccommodations();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da viagem');
    } finally {
      setLoading(false);
    }
  };

  const loadAccommodations = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', user?.id);

      if (error) throw error;
      setAccommodations(data || []);
    } catch (error) {
      console.error('Erro ao carregar hospedagens:', error);
      toast.error('Erro ao carregar hospedagens');
    }
  };

  const resetForm = () => {
    setNewAccommodation({
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

  const handleEditAccommodation = (accommodation: Accommodation) => {
    setEditingAccommodation(accommodation);
    setNewAccommodation({
      hotel_name: accommodation.hotel_name,
      check_in_date: parseISO(accommodation.check_in_date),
      check_out_date: parseISO(accommodation.check_out_date),
      hotel_image_url: accommodation.hotel_image_url || "",
      voucher_file_url: accommodation.voucher_file_url || "",
      voucher_file_name: accommodation.voucher_file_name || "",
      hotel_link: accommodation.hotel_link || "",
      reservation_amount: accommodation.reservation_amount?.toString() || "",
      notes: accommodation.notes || ""
    });
    setShowAddForm(true);
  };

  const handleSaveAccommodation = async () => {
    if (!user || !tripId) return;

    if (!newAccommodation.hotel_name || !newAccommodation.check_in_date || !newAccommodation.check_out_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const accommodationData = {
        trip_id: tripId,
        user_id: user.id,
        hotel_name: newAccommodation.hotel_name,
        check_in_date: format(newAccommodation.check_in_date, 'yyyy-MM-dd'),
        check_out_date: format(newAccommodation.check_out_date, 'yyyy-MM-dd'),
        hotel_image_url: newAccommodation.hotel_image_url || null,
        voucher_file_url: newAccommodation.voucher_file_url || null,
        voucher_file_name: newAccommodation.voucher_file_name || null,
        hotel_link: newAccommodation.hotel_link || null,
        reservation_amount: newAccommodation.reservation_amount ? parseFloat(newAccommodation.reservation_amount) : null,
        notes: newAccommodation.notes || null
      };

      if (editingAccommodation) {
        // Atualizar hospedagem existente
        const { error } = await supabase
          .from('accommodations')
          .update(accommodationData)
          .eq('id', editingAccommodation.id);

        if (error) throw error;
        toast.success('Hospedagem atualizada com sucesso!');
      } else {
        // Criar nova hospedagem
        const { error } = await supabase
          .from('accommodations')
          .insert([accommodationData]);

        if (error) throw error;
        toast.success('Hospedagem adicionada com sucesso!');
      }

      setShowAddForm(false);
      setEditingAccommodation(null);
      resetForm();
      loadAccommodations();
    } catch (error) {
      console.error('Erro ao salvar hospedagem:', error);
      toast.error('Erro ao salvar hospedagem');
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingAccommodation(null);
    resetForm();
  };

  const handleDeleteAccommodation = async (accommodationId: string) => {
    try {
      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', accommodationId);

      if (error) throw error;

      toast.success('Hospedagem excluída com sucesso!');
      loadAccommodations();
    } catch (error) {
      console.error('Erro ao excluir hospedagem:', error);
      toast.error('Erro ao excluir hospedagem');
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
      setNewAccommodation({
        ...newAccommodation,
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
      <PWALayout showFooter={false}>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PWALayout>
    );
  }

  return (
    <PWALayout showFooter={false}>
      <div className="flex flex-col h-screen-mobile">
        {/* Header fixo */}
        <div className="flex-shrink-0 c6-card mx-4 mb-4">
          <TripSectionHeader
            label="Hospedagem"
            title={trip?.title || ""}
            subtitle={trip?.destination || ""}
            onBack={() => navigate(`/viagem/${tripId}`)}
            onAdd={() => setShowAddForm(true)}
            addAriaLabel="Adicionar hospedagem"
          />
        </div>

        {/* Conteúdo com scroll */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-6">

            {/* Formulário para adicionar nova hospedagem */}
            {showAddForm && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>{editingAccommodation ? 'Editar Hospedagem' : 'Nova Hospedagem'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hotel_name">Nome do Hotel *</Label>
                <Input
                  id="hotel_name"
                  value={newAccommodation.hotel_name}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, hotel_name: e.target.value })}
                  placeholder="Digite o nome do hotel"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data de Check-in *</Label>
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
                          !newAccommodation.check_in_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newAccommodation.check_in_date ? format(newAccommodation.check_in_date, "dd/MM/yyyy") : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newAccommodation.check_in_date}
                        onSelect={(date) => setNewAccommodation({ ...newAccommodation, check_in_date: date })}
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
                  <Label>Data de Check-out *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newAccommodation.check_out_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newAccommodation.check_out_date ? format(newAccommodation.check_out_date, "dd/MM/yyyy") : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newAccommodation.check_out_date}
                        onSelect={(date) => setNewAccommodation({ ...newAccommodation, check_out_date: date })}
                        disabled={(date) => {
                          if (!trip?.start_date || !trip?.end_date) return false;
                          const startDate = parseISO(trip.start_date);
                          const endDate = parseISO(trip.end_date);
                          return date < startDate || date > endDate || (newAccommodation.check_in_date && date <= newAccommodation.check_in_date);
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
                  images={newAccommodation.hotel_image_url ? [newAccommodation.hotel_image_url] : []}
                  onImagesChange={(images) => setNewAccommodation({ ...newAccommodation, hotel_image_url: images[0] || "" })}
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
                  {newAccommodation.voucher_file_name && (
                    <span className="text-sm text-muted-foreground">{newAccommodation.voucher_file_name}</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="hotel_link">Link do Hotel</Label>
                <Input
                  id="hotel_link"
                  value={newAccommodation.hotel_link}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, hotel_link: e.target.value })}
                  placeholder="https://www.hotel.com"
                />
              </div>

              <div>
                <Label htmlFor="reservation_amount">Valor da Reserva (R$)</Label>
                <Input
                  id="reservation_amount"
                  type="number"
                  step="0.01"
                  value={newAccommodation.reservation_amount}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, reservation_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newAccommodation.notes}
                  onChange={(e) => setNewAccommodation({ ...newAccommodation, notes: e.target.value })}
                  placeholder="Observações sobre a hospedagem"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveAccommodation} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingAccommodation ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Lista de hospedagens */}
            <div className="grid gap-4">
          {accommodations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">Nenhuma hospedagem cadastrada</p>
                <Button onClick={() => setShowAddForm(true)}>
                  Adicionar Primeira Hospedagem
                </Button>
              </CardContent>
            </Card>
          ) : (
            accommodations.map((accommodation) => (
              <Card key={accommodation.id}>
                <CardHeader>
                  <CardTitle>{accommodation.hotel_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Check-in:</strong> {format(parseISO(accommodation.check_in_date), "dd/MM/yyyy")}
                    </div>
                    <div>
                      <strong>Check-out:</strong> {format(parseISO(accommodation.check_out_date), "dd/MM/yyyy")}
                    </div>
                  </div>

                  {accommodation.hotel_image_url && (
                    <div>
                      <strong>Imagem do Hotel:</strong>
                      <img
                        src={accommodation.hotel_image_url}
                        alt="Hotel"
                        className="w-full h-48 object-cover rounded-lg mt-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate(`/viagem/${tripId}/hospedagem/${accommodation.id}`)}
                      />
                    </div>
                  )}

                  {accommodation.voucher_file_url && (
                    <div className="flex items-center gap-2">
                      <strong>Voucher:</strong>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadVoucher(accommodation.voucher_file_url!, accommodation.voucher_file_name!)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {accommodation.voucher_file_name}
                      </Button>
                    </div>
                  )}

                  {accommodation.hotel_link && (
                    <div className="flex items-center gap-2">
                      <strong>Link do Hotel:</strong>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(accommodation.hotel_link, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Acessar Site
                      </Button>
                    </div>
                  )}

                   {accommodation.reservation_amount && (
                     <div>
                       <strong>Valor da Reserva:</strong> {formatCurrency(accommodation.reservation_amount)}
                     </div>
                   )}

                   {accommodation.notes && (
                     <div>
                       <strong>Observações:</strong>
                       <p className="text-muted-foreground mt-1">{accommodation.notes}</p>
                     </div>
                   )}

                   <div className="flex gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleEditAccommodation(accommodation)}
                       className="flex items-center gap-2"
                     >
                       <Edit className="w-4 h-4" />
                       Editar
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleDeleteAccommodation(accommodation.id)}
                       className="flex items-center gap-2 text-destructive hover:text-destructive"
                     >
                       <Trash2 className="w-4 h-4" />
                       Excluir
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             ))
           )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </PWALayout>
  );
}