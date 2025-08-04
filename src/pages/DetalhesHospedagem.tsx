import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Download, ExternalLink, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { PWALayout } from "@/components/layout/PWALayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

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

  useEffect(() => {
    if (!tripId || !hospedagemId) return;
    fetchAccommodation();
  }, [tripId, hospedagemId]);

  const fetchAccommodation = async () => {
    if (!user || !tripId || !hospedagemId) return;

    try {
      const { data, error } = await supabase
        .from("accommodations")
        .select("*")
        .eq("id", hospedagemId)
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .single();

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
    navigate(`/viagem/${tripId}/hospedagem`);
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
      </div>
    </PWALayout>
  );
}