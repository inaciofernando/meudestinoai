import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Upload, Download, Trash2, ExternalLink, Save, Plus, Edit, ArrowLeft, Navigation } from "lucide-react";
import { PWALayout } from "@/components/layout/PWALayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { cn, formatCurrency } from "@/lib/utils";

interface Accommodation {
  id: string;
  hotel_name: string;
  check_in_date: string;
  check_out_date: string;
  hotel_image_url?: string;
  voucher_file_url?: string;
  voucher_file_name?: string;
  hotel_link?: string;
  waze_link?: string;
  reservation_amount?: number;
  notes?: string;
  accommodation_type?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  room_type?: string;
  confirmation_number?: string;
  includes_breakfast?: boolean;
  wifi_available?: boolean;
  parking_available?: boolean;
  pet_friendly?: boolean;
}

interface AccommodationForm {
  hotel_name: string;
  check_in_date: Date | undefined;
  check_out_date: Date | undefined;
  hotel_image_url: string;
  voucher_file_url: string;
  voucher_file_name: string;
  hotel_link: string;
  waze_link: string;
  reservation_amount: string;
  notes: string;
  accommodation_type: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  room_type: string;
  confirmation_number: string;
  includes_breakfast: boolean;
  wifi_available: boolean;
  parking_available: boolean;
  pet_friendly: boolean;
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
    waze_link: "",
    reservation_amount: "",
    notes: "",
    accommodation_type: "hotel",
    address: "",
    city: "",
    country: "Brasil",
    phone: "",
    email: "",
    room_type: "",
    confirmation_number: "",
    includes_breakfast: false,
    wifi_available: true,
    parking_available: false,
    pet_friendly: false
  });

  useEffect(() => {
    if (tripId && user) {
      loadTripAndAccommodations();
      // Verificar se veio do Concierge e preencher formulário
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('fromConcierge') === 'true') {
        const conciergeData = {
          hotel_name: urlParams.get('hotel_name') || "",
          address: urlParams.get('address') || "",
          city: urlParams.get('city') || "",
          country: urlParams.get('country') || "",
          phone: urlParams.get('phone') || "",
          email: urlParams.get('email') || "",
          hotel_link: urlParams.get('hotel_link') || "",
          waze_link: urlParams.get('waze_link') || "",
          accommodation_type: urlParams.get('accommodation_type') || "hotel",
          notes: urlParams.get('notes') || ""
        };
        
        setNewAccommodation(prev => ({
          ...prev,
          ...conciergeData
        }));
        
        setShowAddForm(true);
        
        // Limpar URL params para uma navegação mais limpa
        window.history.replaceState({}, '', window.location.pathname);
      }
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
      waze_link: "",
      reservation_amount: "",
      notes: "",
      accommodation_type: "hotel",
      address: "",
      city: "",
      country: "Brasil",
      phone: "",
      email: "",
      room_type: "",
      confirmation_number: "",
      includes_breakfast: false,
      wifi_available: true,
      parking_available: false,
      pet_friendly: false
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
      waze_link: accommodation.waze_link || "",
      reservation_amount: accommodation.reservation_amount?.toString() || "",
      notes: accommodation.notes || "",
      accommodation_type: accommodation.accommodation_type || "hotel",
      address: accommodation.address || "",
      city: accommodation.city || "",
      country: accommodation.country || "Brasil",
      phone: accommodation.phone || "",
      email: accommodation.email || "",
      room_type: accommodation.room_type || "",
      confirmation_number: accommodation.confirmation_number || "",
      includes_breakfast: accommodation.includes_breakfast || false,
      wifi_available: accommodation.wifi_available !== false,
      parking_available: accommodation.parking_available || false,
      pet_friendly: accommodation.pet_friendly || false
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
        waze_link: newAccommodation.waze_link || null,
        reservation_amount: newAccommodation.reservation_amount ? parseFloat(newAccommodation.reservation_amount) : null,
        notes: newAccommodation.notes || null,
        accommodation_type: newAccommodation.accommodation_type || 'hotel',
        address: newAccommodation.address || null,
        city: newAccommodation.city || null,
        country: newAccommodation.country || null,
        phone: newAccommodation.phone || null,
        email: newAccommodation.email || null,
        room_type: newAccommodation.room_type || null,
        confirmation_number: newAccommodation.confirmation_number || null,
        includes_breakfast: newAccommodation.includes_breakfast,
        wifi_available: newAccommodation.wifi_available,
        parking_available: newAccommodation.parking_available,
        pet_friendly: newAccommodation.pet_friendly
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
      <div className="space-y-6">
        {/* Header integrado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/viagem/${tripId}`)}
              className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Hospedagem</h1>
              <p className="text-muted-foreground text-sm">Encontre e gerencie suas acomodações</p>
            </div>
          </div>

          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            size="icon"
            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
            aria-label="Adicionar hospedagem"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Formulário para adicionar nova hospedagem */}
        <Dialog open={showAddForm} onOpenChange={(open) => {
          if (!open) {
            handleCancelEdit();
          }
          setShowAddForm(open);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAccommodation ? 'Editar Hospedagem' : 'Nova Hospedagem'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informações Básicas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hotel_name">Nome do Hotel *</Label>
                    <Input
                      id="hotel_name"
                      value={newAccommodation.hotel_name}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, hotel_name: e.target.value })}
                      placeholder="Digite o nome do hotel"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accommodation_type">Tipo de Hospedagem</Label>
                    <Select 
                      value={newAccommodation.accommodation_type}
                      onValueChange={(value) => setNewAccommodation({ ...newAccommodation, accommodation_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="pousada">Pousada</SelectItem>
                        <SelectItem value="resort">Resort</SelectItem>
                        <SelectItem value="hostel">Hostel</SelectItem>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="confirmation_number">Número da Reserva</Label>
                    <Input
                      id="confirmation_number"
                      value={newAccommodation.confirmation_number}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, confirmation_number: e.target.value })}
                      placeholder="Ex: ABC123456"
                    />
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Período da Estadia</h3>
                
                {trip?.start_date && trip?.end_date && (
                  <p className="text-xs text-muted-foreground">
                    Período da viagem: {format(parseISO(trip.start_date), "dd/MM/yyyy")} - {format(parseISO(trip.end_date), "dd/MM/yyyy")}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Check-in *</Label>
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
              </div>

              {/* Localização */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Localização</h3>
                
                <div>
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={newAccommodation.address}
                    onChange={(e) => setNewAccommodation({ ...newAccommodation, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={newAccommodation.city}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, city: e.target.value })}
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={newAccommodation.country}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, country: e.target.value })}
                      placeholder="Brasil"
                    />
                  </div>
                </div>
              </div>

              {/* Detalhes da Acomodação */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Detalhes da Acomodação</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="room_type">Tipo de Quarto</Label>
                    <Select 
                      value={newAccommodation.room_type}
                      onValueChange={(value) => setNewAccommodation({ ...newAccommodation, room_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="deluxe">Deluxe</SelectItem>
                        <SelectItem value="suite">Suíte</SelectItem>
                        <SelectItem value="presidencial">Presidencial</SelectItem>
                        <SelectItem value="family">Familiar</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="double">Double</SelectItem>
                        <SelectItem value="twin">Twin</SelectItem>
                        <SelectItem value="apartamento_completo">Apartamento Completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Comodidades */}
                <div>
                  <Label>Comodidades Incluídas</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includes_breakfast"
                        checked={newAccommodation.includes_breakfast}
                        onCheckedChange={(checked) => setNewAccommodation({ ...newAccommodation, includes_breakfast: !!checked })}
                      />
                      <Label htmlFor="includes_breakfast" className="text-sm">Café da manhã</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wifi_available"
                        checked={newAccommodation.wifi_available}
                        onCheckedChange={(checked) => setNewAccommodation({ ...newAccommodation, wifi_available: !!checked })}
                      />
                      <Label htmlFor="wifi_available" className="text-sm">Wi-Fi gratuito</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="parking_available"
                        checked={newAccommodation.parking_available}
                        onCheckedChange={(checked) => setNewAccommodation({ ...newAccommodation, parking_available: !!checked })}
                      />
                      <Label htmlFor="parking_available" className="text-sm">Estacionamento</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pet_friendly"
                        checked={newAccommodation.pet_friendly}
                        onCheckedChange={(checked) => setNewAccommodation({ ...newAccommodation, pet_friendly: !!checked })}
                      />
                      <Label htmlFor="pet_friendly" className="text-sm">Pet friendly</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contato e Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Contato e Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newAccommodation.phone}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, phone: e.target.value })}
                      placeholder="+55 (11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAccommodation.email}
                      onChange={(e) => setNewAccommodation({ ...newAccommodation, email: e.target.value })}
                      placeholder="contato@hotel.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hotel_link">Link do Hotel/Booking</Label>
                  <Input
                    id="hotel_link"
                    value={newAccommodation.hotel_link}
                    onChange={(e) => setNewAccommodation({ ...newAccommodation, hotel_link: e.target.value })}
                    placeholder="https://www.hotel.com ou link do Booking.com"
                  />
                </div>

                <div>
                  <Label htmlFor="waze_link">Link do Waze</Label>
                  <Input
                    id="waze_link"
                    value={newAccommodation.waze_link}
                    onChange={(e) => setNewAccommodation({ ...newAccommodation, waze_link: e.target.value })}
                    placeholder="https://waze.com/ul?q=Nome+do+Hotel"
                  />
                </div>
              </div>

              {/* Financeiro */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informações Financeiras</h3>
                
                <div>
                  <Label htmlFor="reservation_amount">Valor Total da Reserva (R$)</Label>
                  <Input
                    id="reservation_amount"
                    type="number"
                    step="0.01"
                    value={newAccommodation.reservation_amount}
                    onChange={(e) => setNewAccommodation({ ...newAccommodation, reservation_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Arquivos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Imagens e Documentos</h3>
                
                <div>
                  <Label>Imagem do Hotel</Label>
                  <ImageUpload
                    images={newAccommodation.hotel_image_url ? [newAccommodation.hotel_image_url] : []}
                    onImagesChange={(images) => setNewAccommodation({ ...newAccommodation, hotel_image_url: images[0] || "" })}
                    maxImages={1}
                  />
                </div>

                <div>
                  <Label htmlFor="voucher" className="text-base font-medium">Voucher/Comprovante</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Faça upload do voucher da reserva, confirmação ou comprovante de pagamento
                  </p>
                  
                  <div className="space-y-3">
                    {/* Upload Area */}
                    <div className="relative border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Clique para selecionar ou arraste o arquivo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, PNG, DOC ou DOCX (máx. 10MB)
                          </p>
                        </div>
                        <Input
                          id="voucher"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleVoucherUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* File Status */}
                    {newAccommodation.voucher_file_name && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {newAccommodation.voucher_file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Arquivo enviado com sucesso
                          </p>
                        </div>
                        {newAccommodation.voucher_file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadVoucher(newAccommodation.voucher_file_url, newAccommodation.voucher_file_name)}
                            className="flex-shrink-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Observações</h3>
                
                <div>
                  <Label htmlFor="notes">Observações Gerais</Label>
                  <Textarea
                    id="notes"
                    value={newAccommodation.notes}
                    onChange={(e) => setNewAccommodation({ ...newAccommodation, notes: e.target.value })}
                    placeholder="Informações adicionais sobre a hospedagem..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-6 border-t border-border mt-6">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="flex-1 sm:flex-none sm:px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveAccommodation} 
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none sm:px-6"
                >
                  <Save className="w-4 h-4" />
                  {editingAccommodation ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lista de hospedagens */}
        <div className="grid gap-4">
          {accommodations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">Nenhuma hospedagem cadastrada</p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Adicionar Primeira Hospedagem
                </Button>
              </CardContent>
            </Card>
          ) : (
            accommodations.map((accommodation) => (
              <Card key={accommodation.id} className="hover:shadow-card transition-smooth">
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

                  {accommodation.waze_link && (
                    <div className="flex items-center gap-2">
                      <strong>Navegação:</strong>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(accommodation.waze_link, '_blank')}
                        className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Navigation className="w-4 h-4" />
                        Abrir no Waze
                      </Button>
                    </div>
                  )}

                   {accommodation.notes && (
                     <div>
                       <strong>Observações:</strong>
                       <p className="text-muted-foreground mt-1">{accommodation.notes}</p>
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