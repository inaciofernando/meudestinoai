import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, ExternalLink } from "lucide-react";

interface ShareTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripTitle: string;
  isPublic: boolean;
  publicSlug: string | null;
  onUpdate: (isPublic: boolean, publicSlug: string | null) => void;
}

export function ShareTripDialog({
  open,
  onOpenChange,
  tripId,
  tripTitle,
  isPublic,
  publicSlug,
  onUpdate
}: ShareTripDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const publicUrl = publicSlug ? `${window.location.origin}/viagem/${publicSlug}` : '';

  const handleTogglePublic = async (checked: boolean) => {
    setLoading(true);
    try {
      if (checked) {
        // Gerar slug único se não existir
        let slug = publicSlug;
        if (!slug) {
          const { data, error } = await supabase.rpc('generate_trip_slug', {
            trip_title: tripTitle
          });
          
          if (error) throw error;
          slug = data;
        }

        // Atualizar viagem para ser pública
        const { error } = await supabase
          .from('trips')
          .update({
            is_public: true,
            public_slug: slug
          })
          .eq('id', tripId);

        if (error) throw error;

        onUpdate(true, slug);
        toast({
          title: "Viagem compartilhada!",
          description: "Sua viagem agora pode ser acessada publicamente através do link.",
        });
      } else {
        // Tornar viagem privada
        const { error } = await supabase
          .from('trips')
          .update({
            is_public: false
          })
          .eq('id', tripId);

        if (error) throw error;

        onUpdate(false, publicSlug);
        toast({
          title: "Compartilhamento desativado",
          description: "Sua viagem não é mais pública.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o compartilhamento da viagem.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Link copiado!",
        description: "O link da viagem foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleOpenLink = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Viagem
          </DialogTitle>
          <DialogDescription>
            Permita que outras pessoas visualizem sua viagem através de um link público.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public-switch" className="text-sm font-medium">
                Viagem pública
              </Label>
              <p className="text-sm text-muted-foreground">
                Qualquer pessoa com o link poderá ver sua viagem
              </p>
            </div>
            <Switch
              id="public-switch"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={loading}
            />
          </div>

          {isPublic && publicUrl && (
            <div className="space-y-2">
              <Label>Link público</Label>
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenLink}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe este link para que outras pessoas possam ver sua viagem
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}