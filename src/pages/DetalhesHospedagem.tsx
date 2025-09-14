import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { Download, ExternalLink, ArrowLeft, Edit, Trash2, Calendar as CalendarIcon, Save, Upload, MapPin, Phone, Mail, Wifi, Car, Coffee, Heart, Navigation } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ImageUpload";

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

export default function DetalhesHospedagem() {
  const { id: tripId, hospedagemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    hotel_name: "",
    check_in_date: undefined as Date | undefined,
    check_out_date: undefined as Date | undefined,
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    console.log("DetalhesHospedagem - useEffect", { tripId, hospedagemId, user });
    if (!tripId || !hospedagemId) {
      console.log("Missing tripId or hospedagemId");
      return;
    }
    fetchAccommodation();
  }, [tripId, hospedagemId, user]);

  const fetchAccommodation = async () => {
    console.log("fetchAccommodation called", { user, tripId, hospedagemId });
    if (!user || !tripId || !hospedagemId) {
      console.log("Missing user, tripId, or hospedagemId", { user: !!user, tripId, hospedagemId });
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching accommodation data...");
      const { data, error } = await supabase
        .from("accommodations")
        .select("*")
        .eq("id", hospedagemId)
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Erro ao buscar hospedagem:", error);
        toast.error("Erro ao carregar detalhes da hospedagem");
        return;
      }

      setAccommodation(data);
    } catch (error) {
      console.error("Erro ao buscar hospedagem:", error);
      toast.error("Erro ao carregar detalhes da hospedagem");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccommodation = async () => {
    if (!accommodation || !user) return;

    try {
      let imageUrl = editForm.hotel_image_url;
      let voucherUrl = editForm.voucher_file_url;
      let voucherFileName = editForm.voucher_file_name;

      // Upload da nova imagem se fornecida
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('trip-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          toast.error('Erro ao fazer upload da imagem');
          return;
        }

        const { data } = supabase.storage.from('trip-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // Upload do novo voucher se fornecido
      if (voucherFile) {
        const fileExt = voucherFile.name.split('.').pop();
        const fileName = `${user.id}/voucher_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('trip-documents')
          .upload(fileName, voucherFile);

        if (uploadError) {
          console.error('Erro no upload do voucher:', uploadError);
          toast.error('Erro ao fazer upload do voucher');
          return;
        }

        const { data } = supabase.storage.from('trip-documents').getPublicUrl(fileName);
        voucherUrl = data.publicUrl;
        voucherFileName = voucherFile.name;
      }

      const accommodationData = {
        hotel_name: editForm.hotel_name,
        check_in_date: editForm.check_in_date?.toISOString().split('T')[0],
        check_out_date: editForm.check_out_date?.toISOString().split('T')[0],
        hotel_image_url: imageUrl,
        voucher_file_url: voucherUrl,
        voucher_file_name: voucherFileName,
        hotel_link: editForm.hotel_link,
        waze_link: editForm.waze_link,
        reservation_amount: editForm.reservation_amount ? parseFloat(editForm.reservation_amount) : null,
        notes: editForm.notes,
        accommodation_type: editForm.accommodation_type,
        address: editForm.address,
        city: editForm.city,
        country: editForm.country,
        phone: editForm.phone,
        email: editForm.email,
        room_type: editForm.room_type,
        confirmation_number: editForm.confirmation_number,
        includes_breakfast: editForm.includes_breakfast,
        wifi_available: editForm.wifi_available,
        parking_available: editForm.parking_available,
        pet_friendly: editForm.pet_friendly
      };

      const { error } = await supabase
        .from("accommodations")
        .update(accommodationData)
        .eq("id", accommodation.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao atualizar hospedagem:", error);
        toast.error("Erro ao atualizar hospedagem");
        return;
      }

      toast.success("Hospedagem atualizada com sucesso!");
      setIsEditing(false);
      setImageFile(null);
      setVoucherFile(null);
      fetchAccommodation(); // Recarregar os dados
    } catch (error) {
      console.error("Erro ao atualizar hospedagem:", error);
      toast.error("Erro ao atualizar hospedagem");
    }
  };

  const handleDownloadVoucher = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao baixar voucher:", error);
      toast.error("Erro ao baixar voucher");
    }
  };

  const handleEdit = () => {
    if (!accommodation) return;
    
    setEditForm({
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
      wifi_available: accommodation.wifi_available !== undefined ? accommodation.wifi_available : true,
      parking_available: accommodation.parking_available || false,
      pet_friendly: accommodation.pet_friendly || false
    });
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!accommodation || !user) return;

    try {
      const { error } = await supabase
        .from("accommodations")
        .delete()
        .eq("id", accommodation.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao excluir hospedagem:", error);
        toast.error("Erro ao excluir hospedagem");
        return;
      }

      toast.success("Hospedagem excluída com sucesso!");
      navigate(`/viagem/${tripId}/hospedagem`);
    } catch (error) {
      console.error("Erro ao excluir hospedagem:", error);
      toast.error("Erro ao excluir hospedagem");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <PWALayout showFooter={false}>
          <div className="flex items-center justify-center h-64">
            <p>Carregando...</p>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  if (!accommodation) {
    return (
      <ProtectedRoute>
        <PWALayout showFooter={false}>
          <div className="flex items-center justify-center h-64">
            <p>Hospedagem não encontrada</p>
          </div>
        </PWALayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PWALayout 
        showFooter={false}
        title="Detalhes da Hospedagem"
        onBack={() => navigate(`/viagem/${tripId}/hospedagem`)}
      >
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
          {/* Hero Section */}
          <div className="relative">
            {accommodation.hotel_image_url ? (
              <div className="relative h-64 sm:h-80 overflow-hidden">
                <img
                  src={accommodation.hotel_image_url}
                  alt={accommodation.hotel_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    {accommodation.hotel_name}
                  </h1>
                  <div className="flex items-center gap-2 text-white/90 bg-black/30 px-3 py-2 rounded-lg backdrop-blur-sm w-fit">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{format(parseISO(accommodation.check_in_date), "dd/MM")} - {format(parseISO(accommodation.check_out_date), "dd/MM/yyyy")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                  {accommodation.hotel_name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground bg-background/50 px-3 py-2 rounded-lg w-fit">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{format(parseISO(accommodation.check_in_date), "dd/MM")} - {format(parseISO(accommodation.check_out_date), "dd/MM/yyyy")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 pb-8">

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Valor da Reserva */}
              {accommodation.reservation_amount && (
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Valor da Reserva</h3>
                  <p className="text-3xl font-bold text-primary mb-1">
                    {formatCurrency(accommodation.reservation_amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total pago</p>
                </div>
              )}

              {/* Informações Adicionais */}
              {(accommodation.confirmation_number || accommodation.room_type) && (
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Detalhes da Reserva</h3>
                  <div className="space-y-2">
                    {accommodation.confirmation_number && (
                      <div>
                        <p className="text-sm text-muted-foreground">Código da reserva</p>
                        <p className="font-medium">{accommodation.confirmation_number}</p>
                      </div>
                    )}
                    {accommodation.room_type && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de quarto</p>
                        <p className="font-medium">{accommodation.room_type}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Links Rápidos */}
            {(accommodation.hotel_link || accommodation.waze_link) && (
              <div className="mb-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Links Rápidos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accommodation.hotel_link && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(accommodation.hotel_link, "_blank")}
                        className="justify-start h-12"
                      >
                        <ExternalLink className="w-4 h-4 mr-3" />
                        Site do Hotel
                      </Button>
                    )}
                    {accommodation.waze_link && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(accommodation.waze_link, "_blank")}
                        className="justify-start h-12"
                      >
                        <Navigation className="w-4 h-4 mr-3" />
                        Navegar no Waze
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Localização */}
            {(accommodation.address || accommodation.city || accommodation.country) && (
              <div className="mb-6">
                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Localização</h3>
                  </div>
                  <div className="space-y-4">
                    {accommodation.address && (
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">ENDEREÇO</p>
                        <p className="font-medium">{accommodation.address}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {accommodation.city && (
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">CIDADE</p>
                          <p className="font-medium">{accommodation.city}</p>
                        </div>
                      )}
                      {accommodation.country && (
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">PAÍS</p>
                          <p className="font-medium">{accommodation.country}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contato */}
            {(accommodation.phone || accommodation.email) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {accommodation.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <strong>Telefone:</strong>
                        <p className="text-muted-foreground">{accommodation.phone}</p>
                      </div>
                    </div>
                  )}
                  {accommodation.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <strong>Email:</strong>
                        <p className="text-muted-foreground">{accommodation.email}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Comodidades */}
            {(accommodation.includes_breakfast || accommodation.wifi_available || accommodation.parking_available || accommodation.pet_friendly) && (
              <div className="mb-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Comodidades</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {accommodation.includes_breakfast && (
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-primary" />
                        <span className="text-sm">Café da manhã incluído</span>
                      </div>
                    )}
                    {accommodation.wifi_available && (
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-primary" />
                        <span className="text-sm">Wi-Fi disponível</span>
                      </div>
                    )}
                    {accommodation.parking_available && (
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-primary" />
                        <span className="text-sm">Estacionamento</span>
                      </div>
                    )}
                    {accommodation.pet_friendly && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-primary" />
                        <span className="text-sm">Pet friendly</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Links e Navegação */}
            {(accommodation.hotel_link || accommodation.waze_link) && (
              <Card>
                <CardHeader>
                  <CardTitle>Links e Navegação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {accommodation.hotel_link && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(accommodation.hotel_link, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Acessar Site do Hotel
                    </Button>
                  )}
                  {accommodation.waze_link && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => window.open(accommodation.waze_link, '_blank')}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Abrir no Waze
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documentos */}
            {accommodation.voucher_file_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDownloadVoucher(accommodation.voucher_file_url!, accommodation.voucher_file_name!)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {accommodation.voucher_file_name || 'Baixar Voucher'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Voucher */}
            {accommodation.voucher_file_url && (
              <div className="mb-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Voucher</h3>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadVoucher(accommodation.voucher_file_url!, accommodation.voucher_file_name || "voucher")}
                    className="w-full justify-start h-12"
                  >
                    <Download className="w-4 h-4 mr-3" />
                    Baixar Voucher ({accommodation.voucher_file_name || "arquivo"})
                  </Button>
                </div>
              </div>
            )}

            {/* Comodidades */}
            {(accommodation.includes_breakfast || accommodation.wifi_available || accommodation.parking_available || accommodation.pet_friendly) && (
              <div className="mb-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Comodidades</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {accommodation.includes_breakfast && (
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-primary" />
                        <span className="text-sm">Café da manhã incluído</span>
                      </div>
                    )}
                    {accommodation.wifi_available && (
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-primary" />
                        <span className="text-sm">Wi-Fi disponível</span>
                      </div>
                    )}
                    {accommodation.parking_available && (
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-primary" />
                        <span className="text-sm">Estacionamento</span>
                      </div>
                    )}
                    {accommodation.pet_friendly && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-primary" />
                        <span className="text-sm">Pet friendly</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contato */}
            {(accommodation.phone || accommodation.email) && (
              <div className="mb-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Contato</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {accommodation.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{accommodation.phone}</p>
                        </div>
                      </div>
                    )}
                    {accommodation.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">E-mail</p>
                          <p className="font-medium">{accommodation.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {accommodation.notes && (
              <div className="mb-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Observações</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{accommodation.notes}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex-1 h-12"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex-1 h-12"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>

        </div>

        {/* Modal de Edição */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Hospedagem</DialogTitle>
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
                      value={editForm.hotel_name}
                      onChange={(e) => setEditForm({ ...editForm, hotel_name: e.target.value })}
                      placeholder="Digite o nome do hotel"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accommodation_type">Tipo de Hospedagem</Label>
                    <Select 
                      value={editForm.accommodation_type}
                      onValueChange={(value) => setEditForm({ ...editForm, accommodation_type: value })}
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
                      value={editForm.confirmation_number}
                      onChange={(e) => setEditForm({ ...editForm, confirmation_number: e.target.value })}
                      placeholder="Ex: ABC123456"
                    />
                  </div>
                </div>
              </div>

              {/* Período da Estadia */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Período da Estadia</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Check-in *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editForm.check_in_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editForm.check_in_date ? format(editForm.check_in_date, "dd/MM/yyyy") : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editForm.check_in_date}
                          onSelect={(date) => setEditForm({ ...editForm, check_in_date: date })}
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
                            !editForm.check_out_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editForm.check_out_date ? format(editForm.check_out_date, "dd/MM/yyyy") : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editForm.check_out_date}
                          onSelect={(date) => setEditForm({ ...editForm, check_out_date: date })}
                          disabled={(date) => {
                            return editForm.check_in_date && date <= editForm.check_in_date;
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
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
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
                      value={editForm.room_type}
                      onValueChange={(value) => setEditForm({ ...editForm, room_type: value })}
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
                        checked={editForm.includes_breakfast}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, includes_breakfast: !!checked })}
                      />
                      <Label htmlFor="includes_breakfast" className="text-sm">Café da manhã</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wifi_available"
                        checked={editForm.wifi_available}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, wifi_available: !!checked })}
                      />
                      <Label htmlFor="wifi_available" className="text-sm">Wi-Fi gratuito</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="parking_available"
                        checked={editForm.parking_available}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, parking_available: !!checked })}
                      />
                      <Label htmlFor="parking_available" className="text-sm">Estacionamento</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pet_friendly"
                        checked={editForm.pet_friendly}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, pet_friendly: !!checked })}
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
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+55 (11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="contato@hotel.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hotel_link">Link do Hotel/Booking</Label>
                  <Input
                    id="hotel_link"
                    value={editForm.hotel_link}
                    onChange={(e) => setEditForm({ ...editForm, hotel_link: e.target.value })}
                    placeholder="https://www.hotel.com ou link do Booking.com"
                  />
                </div>

                <div>
                  <Label htmlFor="waze_link">Link do Waze</Label>
                  <Input
                    id="waze_link"
                    value={editForm.waze_link}
                    onChange={(e) => setEditForm({ ...editForm, waze_link: e.target.value })}
                    placeholder="https://waze.com/ul?q=Nome+do+Hotel"
                  />
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informações Financeiras</h3>
                
                <div>
                  <Label htmlFor="reservation_amount">Valor Total da Reserva (R$)</Label>
                  <Input
                    id="reservation_amount"
                    type="number"
                    step="0.01"
                    value={editForm.reservation_amount}
                    onChange={(e) => setEditForm({ ...editForm, reservation_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Imagens e Documentos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Imagens e Documentos</h3>
                
                <div>
                  <Label>Imagem do Hotel</Label>
                  <ImageUpload
                    images={editForm.hotel_image_url ? [editForm.hotel_image_url] : []}
                    onImagesChange={(images) => setEditForm({ ...editForm, hotel_image_url: images[0] || "" })}
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setVoucherFile(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* File Status */}
                    {(voucherFile || editForm.voucher_file_name) && (
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
                            {voucherFile ? voucherFile.name : editForm.voucher_file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {voucherFile ? "Novo arquivo selecionado" : "Arquivo atual"}
                          </p>
                        </div>
                        {editForm.voucher_file_url && !voucherFile && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadVoucher(editForm.voucher_file_url, editForm.voucher_file_name)}
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
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Informações adicionais sobre a hospedagem..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-6 border-t border-border mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 sm:flex-none sm:px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateAccommodation} 
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none sm:px-6"
                >
                  <Save className="w-4 h-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Hospedagem</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta hospedagem? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PWALayout>
    </ProtectedRoute>
  );
}