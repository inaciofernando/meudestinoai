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
import { Download, ExternalLink, ArrowLeft, Edit, Trash2, Calendar as CalendarIcon, Save, Upload } from "lucide-react";
import { PWALayout } from "@/components/layout/PWALayout";
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
  reservation_amount?: number;
  notes?: string;
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
        const fileName = `voucher_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('trip-documents')
          .upload(fileName, voucherFile);

        if (uploadError) {
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

    if (!confirm("Tem certeza que deseja excluir esta hospedagem?")) return;

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
    }
  };

  if (loading) {
    return (
      <PWALayout>
        <div className="flex items-center justify-center h-64">
          <p>Carregando...</p>
        </div>
      </PWALayout>
    );
  }

  if (!accommodation) {
    return (
      <PWALayout>
        <div className="flex items-center justify-center h-64">
          <p>Hospedagem não encontrada</p>
        </div>
      </PWALayout>
    );
  }

  return (
    <PWALayout>
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex-shrink-0 p-4 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/viagem/${tripId}/hospedagem`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold">{accommodation.hotel_name}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </Button>
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

            {/* Informações da Reserva */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Reserva</CardTitle>
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

                {accommodation.reservation_amount && (
                  <div>
                    <strong>Valor da Reserva:</strong>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {formatCurrency(accommodation.reservation_amount, "R$")}
                    </p>
                  </div>
                )}

                {accommodation.notes && (
                  <div>
                    <strong>Observações:</strong>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{accommodation.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentos e Links */}
            <Card>
              <CardHeader>
                <CardTitle>Documentos e Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
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
      </div>
    </PWALayout>
  );
}