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
import { format, parseISO } from "date-fns";
import { Download, ExternalLink, ArrowLeft, Edit, Trash2, Calendar as CalendarIcon, Save, Upload, MapPin, Phone, Mail, Wifi, Car, Coffee, Heart, Navigation } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PWALayout } from "@/components/layout/PWALayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";

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
    reservation_amount: "",
    notes: ""
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
        reservation_amount: editForm.reservation_amount ? parseFloat(editForm.reservation_amount) : null,
        notes: editForm.notes
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
      reservation_amount: accommodation.reservation_amount?.toString() || "",
      notes: accommodation.notes || ""
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
        subtitle={accommodation.hotel_name}
        onBack={() => navigate(`/viagem/${tripId}/hospedagem`)}
      >
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
          <div className="flex-shrink-0 p-4 bg-background/95 backdrop-blur-sm border-b">
        {/* Seção de ações */}
        <div className="space-y-3">
          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            </div>
          </div>
          
          {/* Linha 2: Título */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight break-words">
              {accommodation.hotel_name}
            </h1>
          </div>
        </div>
      </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Imagem do Hotel */}
            {accommodation.hotel_image_url && (
              <Card>
                <CardContent className="p-6">
                  <img
                    src={accommodation.hotel_image_url}
                    alt={accommodation.hotel_name}
                    className="w-full h-64 md:h-96 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Tipo de Hospedagem:</strong>
                    <p className="text-muted-foreground mt-1 capitalize">
                      {accommodation.accommodation_type || 'Hotel'}
                    </p>
                  </div>
                  {accommodation.confirmation_number && (
                    <div>
                      <strong>Número da Reserva:</strong>
                      <p className="text-muted-foreground mt-1 font-mono">
                        {accommodation.confirmation_number}
                      </p>
                    </div>
                  )}
                  {accommodation.room_type && (
                    <div>
                      <strong>Tipo de Quarto:</strong>
                      <p className="text-muted-foreground mt-1 capitalize">
                        {accommodation.room_type}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Período da Estadia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Período da Estadia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Check-in:</strong>
                    <p className="text-lg mt-1">{format(parseISO(accommodation.check_in_date), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <strong>Check-out:</strong>
                    <p className="text-lg mt-1">{format(parseISO(accommodation.check_out_date), "dd/MM/yyyy")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localização */}
            {(accommodation.address || accommodation.city || accommodation.country) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Localização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {accommodation.address && (
                    <div>
                      <strong>Endereço:</strong>
                      <p className="text-muted-foreground mt-1">{accommodation.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accommodation.city && (
                      <div>
                        <strong>Cidade:</strong>
                        <p className="text-muted-foreground mt-1">{accommodation.city}</p>
                      </div>
                    )}
                    {accommodation.country && (
                      <div>
                        <strong>País:</strong>
                        <p className="text-muted-foreground mt-1">{accommodation.country}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="w-5 h-5" />
                    Comodidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {accommodation.includes_breakfast && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Coffee className="w-4 h-4" />
                        <span className="text-sm">Café da manhã</span>
                      </div>
                    )}
                    {accommodation.wifi_available && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm">Wi-Fi gratuito</span>
                      </div>
                    )}
                    {accommodation.parking_available && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Car className="w-4 h-4" />
                        <span className="text-sm">Estacionamento</span>
                      </div>
                    )}
                    {accommodation.pet_friendly && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">Pet friendly</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações Financeiras */}
            {accommodation.reservation_amount && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações Financeiras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <strong>Valor Total da Reserva:</strong>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {formatCurrency(accommodation.reservation_amount, "R$")}
                    </p>
                  </div>
                </CardContent>
              </Card>
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

            {/* Observações */}
            {accommodation.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{accommodation.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modal de Edição */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Hospedagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-hotel-name">Nome do Hotel</Label>
                <Input
                  id="edit-hotel-name"
                  value={editForm.hotel_name}
                  onChange={(e) => setEditForm({ ...editForm, hotel_name: e.target.value })}
                  placeholder="Nome do hotel"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data de Check-in</Label>
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
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editForm.check_in_date}
                        onSelect={(date) => setEditForm({ ...editForm, check_in_date: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Data de Check-out</Label>
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
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editForm.check_out_date}
                        onSelect={(date) => setEditForm({ ...editForm, check_out_date: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-reservation-amount">Valor da Reserva (R$)</Label>
                <Input
                  id="edit-reservation-amount"
                  type="number"
                  value={editForm.reservation_amount}
                  onChange={(e) => setEditForm({ ...editForm, reservation_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="edit-hotel-link">Link do Hotel</Label>
                <Input
                  id="edit-hotel-link"
                  value={editForm.hotel_link}
                  onChange={(e) => setEditForm({ ...editForm, hotel_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Observações sobre a hospedagem..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-image">Imagem do Hotel</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="edit-image" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {imageFile ? (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-green-600" />
                            <p className="text-sm text-green-600 font-medium">{imageFile.name}</p>
                            <p className="text-xs text-muted-foreground">Clique para alterar</p>
                          </>
                        ) : editForm.hotel_image_url ? (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-blue-600" />
                            <p className="text-sm text-blue-600 font-medium">Imagem atual anexada</p>
                            <p className="text-xs text-muted-foreground">Clique para substituir</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para anexar</span> uma imagem
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                          </>
                        )}
                      </div>
                      <Input
                        id="edit-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-voucher">Voucher (PDF ou Imagem)</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="edit-voucher" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {voucherFile ? (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-green-600" />
                            <p className="text-sm text-green-600 font-medium">{voucherFile.name}</p>
                            <p className="text-xs text-muted-foreground">Clique para alterar</p>
                          </>
                        ) : editForm.voucher_file_name ? (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-blue-600" />
                            <p className="text-sm text-blue-600 font-medium">Voucher atual: {editForm.voucher_file_name}</p>
                            <p className="text-xs text-muted-foreground">Clique para substituir</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para anexar</span> o voucher
                            </p>
                            <p className="text-xs text-muted-foreground">PDF, PNG, JPG até 10MB</p>
                          </>
                        )}
                      </div>
                      <Input
                        id="edit-voucher"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setVoucherFile(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateAccommodation}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
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