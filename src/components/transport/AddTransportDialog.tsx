import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plane, Bus, Train, Car, Ship, MapPin } from "lucide-react";
import { VoucherUpload } from "@/components/VoucherUpload";
import { TransportBooking } from "@/pages/Transporte";

interface AddTransportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (booking: TransportBooking) => void;
  tripId: string;
}

const formSchema = z.object({
  transport_type: z.string().min(1, "Tipo de transporte é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  departure_location: z.string().optional(),
  arrival_location: z.string().optional(),
  departure_date: z.date().optional(),
  departure_time: z.string().optional(),
  arrival_date: z.date().optional(),
  arrival_time: z.string().optional(),
  provider_name: z.string().optional(),
  booking_reference: z.string().optional(),
  confirmation_number: z.string().optional(),
  seat_number: z.string().optional(),
  gate_info: z.string().optional(),
  vehicle_info: z.string().optional(),
  total_amount: z.string().optional(),
  currency: z.string().default("BRL"),
  booking_status: z.string().default("confirmed"),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const TRANSPORT_TYPES = [
  { value: "flight", label: "Voo", icon: Plane },
  { value: "bus", label: "Ônibus", icon: Bus },
  { value: "train", label: "Trem", icon: Train },
  { value: "car_rental", label: "Aluguel de Carro", icon: Car },
  { value: "transfer", label: "Transfer", icon: Car },
  { value: "boat", label: "Barco", icon: Ship },
  { value: "other", label: "Outro", icon: MapPin },
];

const CURRENCIES = [
  { value: "BRL", label: "Real (BRL)" },
  { value: "USD", label: "Dólar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "Libra (GBP)" },
];

const BOOKING_STATUS = [
  { value: "confirmed", label: "Confirmado" },
  { value: "pending", label: "Pendente" },
  { value: "cancelled", label: "Cancelado" },
];

export function AddTransportDialog({ isOpen, onClose, onAdd, tripId }: AddTransportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ticketFiles, setTicketFiles] = useState<{ url: string; name: string; type: string; description?: string }[]>([]);
  const [voucherFiles, setVoucherFiles] = useState<{ url: string; name: string; type: string; description?: string }[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transport_type: "",
      title: "",
      description: "",
      departure_location: "",
      arrival_location: "",
      departure_time: "",
      arrival_time: "",
      provider_name: "",
      booking_reference: "",
      confirmation_number: "",
      seat_number: "",
      gate_info: "",
      vehicle_info: "",
      total_amount: "",
      currency: "BRL",
      booking_status: "confirmed",
      payment_method: "",
      notes: "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    if (!user) return;

    setLoading(true);

    try {
      const bookingData = {
        trip_id: tripId,
        user_id: user.id,
        transport_type: data.transport_type,
        title: data.title,
        description: data.description || null,
        departure_location: data.departure_location || null,
        arrival_location: data.arrival_location || null,
        departure_date: data.departure_date ? format(data.departure_date, "yyyy-MM-dd") : null,
        departure_time: data.departure_time || null,
        arrival_date: data.arrival_date ? format(data.arrival_date, "yyyy-MM-dd") : null,
        arrival_time: data.arrival_time || null,
        provider_name: data.provider_name || null,
        booking_reference: data.booking_reference || null,
        confirmation_number: data.confirmation_number || null,
        seat_number: data.seat_number || null,
        gate_info: data.gate_info || null,
        vehicle_info: data.vehicle_info || null,
        total_amount: data.total_amount ? parseFloat(data.total_amount) : null,
        currency: data.currency,
        booking_status: data.booking_status,
        payment_method: data.payment_method || null,
        ticket_file_name: ticketFiles[0]?.name || null,
        ticket_file_url: ticketFiles[0]?.url || null,
        voucher_file_name: voucherFiles[0]?.name || null,
        voucher_file_url: voucherFiles[0]?.url || null,
        notes: data.notes || null,
      };

      const { data: newBooking, error } = await supabase
        .from("transport_bookings")
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      onAdd(newBooking);
      form.reset();
      setTicketFiles([]);
      setVoucherFiles([]);
      
      toast({
        title: "Sucesso!",
        description: "Transporte adicionado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao adicionar transporte:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o transporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setTicketFiles([]);
    setVoucherFiles([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adicionar Transporte</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transport_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Transporte</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRANSPORT_TYPES.map((type) => {
                          const IconComponent = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="booking_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status da reserva" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BOOKING_STATUS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Voo para São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes adicionais sobre o transporte..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departure_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local de Partida</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Aeroporto de Brasília" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arrival_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local de Chegada</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Aeroporto de Congonhas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="departure_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Partida</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecionar data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="departure_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Partida</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="arrival_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Chegada</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecionar data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="arrival_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Chegada</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operadora/Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: TAM, GOL, Localiza..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmation_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Confirmação</FormLabel>
                    <FormControl>
                      <Input placeholder="Código de confirmação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Ticket/Bilhete</label>
                <VoucherUpload
                  vouchers={ticketFiles}
                  onVouchersChange={setTicketFiles}
                  maxFiles={1}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Voucher/Comprovante</label>
                <VoucherUpload
                  vouchers={voucherFiles}
                  onVouchersChange={setVoucherFiles}
                  maxFiles={1}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Anotações adicionais..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="text-foreground">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}