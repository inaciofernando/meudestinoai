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
import { Calendar as CalendarIcon, Clock, Download, Trash2, ExternalLink, Save, Plus, Edit, UtensilsCrossed, MapPin, Route } from "lucide-react";
import { PWALayout } from "@/components/layout/PWALayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { cn, formatCurrency } from "@/lib/utils";

interface Restaurant {
  id: string;
  restaurant_name: string;
  reservation_date?: string;
  reservation_time?: string;
  restaurant_image_url?: string;
  voucher_file_url?: string;
  voucher_file_name?: string;
  restaurant_link?: string;
  tripadvisor_link?: string;
  google_maps_link?: string;
  waze_link?: string;
  estimated_amount?: number;
  cuisine_type?: string;
  address?: string;
  phone?: string;
  notes?: string;
}

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

export default function Restaurantes() {
  const { id: tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [newRestaurant, setNewRestaurant] = useState<RestaurantForm>({
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
    notes: ""
  });

  useEffect(() => {
    if (tripId && user) {
      loadTripAndRestaurants();
    }
    
    // Check for pre-filled data from concierge
    const urlParams = new URLSearchParams(window.location.search);
    const nameFromConcierge = urlParams.get('name');
    const descriptionFromConcierge = urlParams.get('description');
    const fromConcierge = urlParams.get('fromConcierge');
    const cuisineFromConcierge = urlParams.get('cuisine');
    const addressFromConcierge = urlParams.get('address');
    const linkFromConcierge = urlParams.get('link');
    const tripadvisorFromConcierge = urlParams.get('tripadvisor');
    const gmapFromConcierge = urlParams.get('gmap');
    const wazeFromConcierge = urlParams.get('waze');
    const estimatedFromConcierge = urlParams.get('estimated_amount');
    const sourceText = urlParams.get('source') || '';

    // Fallback: try to extract links from source text
    let linkFromSource = '';
    let tripFromSource = '';
    let gmapFromSource = '';
    let wazeFromSource = '';
    if (sourceText) {
      const tripMatch = sourceText.match(/https?:\/\/(?:www\.)?tripadvisor\.\S+/i);
      if (tripMatch) tripFromSource = tripMatch[0];
      const gmapMatch = sourceText.match(/https?:\/\/(?:maps\.|www\.)?google\.[^\s)]+/i);
      if (gmapMatch) gmapFromSource = gmapMatch[0];
      const wazeMatch = sourceText.match(/https?:\/\/waze\.com\/[^\s)]+/i);
      if (wazeMatch) wazeFromSource = wazeMatch[0];
      const anyLink = sourceText.match(/https?:\/\/[^\s)]+/i);
      if (anyLink) linkFromSource = anyLink[0];
    }
    
    console.log("🔍 Checking URL params:", { nameFromConcierge, descriptionFromConcierge, cuisineFromConcierge, addressFromConcierge, linkFromConcierge, linkFromSource, estimatedFromConcierge, fromConcierge, fullUrl: window.location.href });
    
    if (fromConcierge && (nameFromConcierge || descriptionFromConcierge || linkFromConcierge || linkFromSource)) {
      console.log("✅ Pre-filling form with concierge data");
      setNewRestaurant(prev => ({
        ...prev,
        restaurant_name: nameFromConcierge || prev.restaurant_name,
        notes: descriptionFromConcierge || prev.notes,
        cuisine_type: cuisineFromConcierge || prev.cuisine_type,
        address: addressFromConcierge || prev.address,
        restaurant_link: linkFromConcierge || linkFromSource || prev.restaurant_link,
        tripadvisor_link: tripadvisorFromConcierge || prev.tripadvisor_link,
        google_maps_link: gmapFromConcierge || prev.google_maps_link,
        waze_link: wazeFromConcierge || prev.waze_link,
        estimated_amount: estimatedFromConcierge || prev.estimated_amount
      }));
      setShowAddForm(true);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (fromConcierge && !nameFromConcierge) {
      console.log("🎯 From concierge but no specific restaurant - opening form");
      setShowAddForm(true);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [tripId, user]);

  const loadTripAndRestaurants = async () => {
    try {
      // Carregar dados da viagem
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Carregar restaurantes
      await loadRestaurants();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da viagem');
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', user?.id);

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Erro ao carregar restaurantes:', error);
      toast.error('Erro ao carregar restaurantes');
    }
  };

  const resetForm = () => {
    setNewRestaurant({
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
      notes: ""
    });
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    navigate(`/viagem/${tripId}/restaurantes/${restaurant.id}/editar`);
  };

  const handleSaveRestaurant = async () => {
    if (!user || !tripId) return;

    if (!newRestaurant.restaurant_name) {
      toast.error('Nome do restaurante é obrigatório');
      return;
    }

    try {
      const restaurantData = {
        trip_id: tripId,
        user_id: user.id,
        restaurant_name: newRestaurant.restaurant_name,
        reservation_date: newRestaurant.reservation_date ? format(newRestaurant.reservation_date, 'yyyy-MM-dd') : null,
        reservation_time: newRestaurant.reservation_time || null,
        restaurant_image_url: newRestaurant.restaurant_image_url || null,
        voucher_file_url: newRestaurant.voucher_file_url || null,
        voucher_file_name: newRestaurant.voucher_file_name || null,
        restaurant_link: newRestaurant.restaurant_link || null,
        tripadvisor_link: newRestaurant.tripadvisor_link || null,
        google_maps_link: newRestaurant.google_maps_link || null,
        waze_link: newRestaurant.waze_link || null,
        estimated_amount: newRestaurant.estimated_amount ? parseFloat(newRestaurant.estimated_amount) : null,
        cuisine_type: newRestaurant.cuisine_type || null,
        address: newRestaurant.address || null,
        phone: newRestaurant.phone || null,
        notes: newRestaurant.notes || null
      };

      if (editingRestaurant) {
        // Atualizar restaurante existente
        const { error } = await supabase
          .from('restaurants')
          .update(restaurantData)
          .eq('id', editingRestaurant.id);

        if (error) throw error;
        toast.success('Restaurante atualizado com sucesso!');
      } else {
        // Criar novo restaurante
        const { error } = await supabase
          .from('restaurants')
          .insert([restaurantData]);

        if (error) throw error;
        toast.success('Restaurante adicionado com sucesso!');
      }

      setShowAddForm(false);
      setEditingRestaurant(null);
      resetForm();
      loadRestaurants();
    } catch (error) {
      console.error('Erro ao salvar restaurante:', error);
      toast.error('Erro ao salvar restaurante');
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingRestaurant(null);
    resetForm();
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;

      toast.success('Restaurante excluído com sucesso!');
      loadRestaurants();
    } catch (error) {
      console.error('Erro ao excluir restaurante:', error);
      toast.error('Erro ao excluir restaurante');
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
      setNewRestaurant({
        ...newRestaurant,
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
          <h1 className="text-2xl font-bold">Restaurantes</h1>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Restaurante
          </Button>
        </div>

        {/* Formulário para adicionar novo restaurante */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingRestaurant ? 'Editar Restaurante' : 'Novo Restaurante'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="restaurant_name">Nome do Restaurante *</Label>
                <Input
                  id="restaurant_name"
                  value={newRestaurant.restaurant_name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, restaurant_name: e.target.value })}
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
                          !newRestaurant.reservation_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newRestaurant.reservation_date ? format(newRestaurant.reservation_date, "dd/MM/yyyy") : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newRestaurant.reservation_date}
                        onSelect={(date) => setNewRestaurant({ ...newRestaurant, reservation_date: date })}
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
                    value={newRestaurant.reservation_time}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, reservation_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cuisine_type">Tipo de Culinária</Label>
                <Input
                  id="cuisine_type"
                  value={newRestaurant.cuisine_type}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine_type: e.target.value })}
                  placeholder="Ex: Italiana, Japonesa, Brasileira"
                />
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                  placeholder="Endereço do restaurante"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label>Imagem do Restaurante</Label>
                <ImageUpload
                  images={newRestaurant.restaurant_image_url ? [newRestaurant.restaurant_image_url] : []}
                  onImagesChange={(images) => setNewRestaurant({ ...newRestaurant, restaurant_image_url: images[0] || "" })}
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
                  {newRestaurant.voucher_file_name && (
                    <span className="text-sm text-muted-foreground">{newRestaurant.voucher_file_name}</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="restaurant_link">Link do Restaurante (site oficial)</Label>
                <Input
                  id="restaurant_link"
                  value={newRestaurant.restaurant_link}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, restaurant_link: e.target.value })}
                  placeholder="https://www.restaurante.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tripadvisor_link">Tripadvisor</Label>
                  <Input
                    id="tripadvisor_link"
                    value={newRestaurant.tripadvisor_link}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, tripadvisor_link: e.target.value })}
                    placeholder="https://www.tripadvisor.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="google_maps_link">Google Maps</Label>
                  <Input
                    id="google_maps_link"
                    value={newRestaurant.google_maps_link}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, google_maps_link: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="waze_link">Waze</Label>
                  <Input
                    id="waze_link"
                    value={newRestaurant.waze_link}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, waze_link: e.target.value })}
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
                  value={newRestaurant.estimated_amount}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, estimated_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newRestaurant.notes}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, notes: e.target.value })}
                  placeholder="Observações sobre o restaurante"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveRestaurant} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingRestaurant ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de restaurantes */}
        <div className="grid gap-4">
          {restaurants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum restaurante cadastrado</p>
                <Button onClick={() => setShowAddForm(true)}>
                  Adicionar Primeiro Restaurante
                </Button>
              </CardContent>
            </Card>
          ) : (
            restaurants.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                      {restaurant.restaurant_name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRestaurant(restaurant)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(restaurant.reservation_date || restaurant.reservation_time) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {restaurant.reservation_date && (
                        <div>
                          <strong>Data da Reserva:</strong> {format(parseISO(restaurant.reservation_date), "dd/MM/yyyy")}
                        </div>
                      )}
                      {restaurant.reservation_time && (
                        <div>
                          <strong>Horário:</strong> {restaurant.reservation_time}
                        </div>
                      )}
                    </div>
                  )}

                  {restaurant.cuisine_type && (
                    <div>
                      <strong>Tipo de Culinária:</strong> {restaurant.cuisine_type}
                    </div>
                  )}

                  {restaurant.address && (
                    <div>
                      <strong>Endereço:</strong> {restaurant.address}
                    </div>
                  )}

                  {restaurant.phone && (
                    <div>
                      <strong>Telefone:</strong> {restaurant.phone}
                    </div>
                  )}

                  {restaurant.restaurant_image_url && (
                    <div>
                      <strong>Imagem do Restaurante:</strong>
                      <img
                        src={restaurant.restaurant_image_url}
                        alt="Restaurante"
                        className="w-full h-48 object-cover rounded-lg mt-2"
                      />
                    </div>
                  )}

                  {restaurant.voucher_file_url && (
                    <div className="flex items-center gap-2">
                      <strong>Voucher:</strong>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadVoucher(restaurant.voucher_file_url!, restaurant.voucher_file_name!)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {restaurant.voucher_file_name}
                      </Button>
                    </div>
                  )}

                  {restaurant.restaurant_link && (
                    <div className="flex items-center gap-2">
                      <strong>Link do Restaurante:</strong>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(restaurant.restaurant_link, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Acessar Site
                      </Button>
                    </div>
                  )}

                  {restaurant.estimated_amount && (
                    <div>
                      <strong>Valor Estimado:</strong> {formatCurrency(restaurant.estimated_amount, "R$")}
                    </div>
                  )}

                  {restaurant.notes && (
                    <div>
                      <strong>Observações:</strong>
                      <p className="text-muted-foreground mt-1">{restaurant.notes}</p>
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