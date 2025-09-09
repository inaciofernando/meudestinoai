import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, Utensils, Plane, Hotel, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  images: string[];
  total_budget: number;
  budget_currency: string;
}

interface TripLocation {
  id: string;
  location_name: string;
  location_type: string;
  order_index: number;
}

interface Accommodation {
  id: string;
  hotel_name: string;
  city: string;
  check_in_date: string;
  check_out_date: string;
  hotel_image_url: string | null;
}

interface Restaurant {
  id: string;
  restaurant_name: string;
  cuisine_type: string | null;
  reservation_date: string | null;
  restaurant_image_url: string | null;
}

interface Transport {
  id: string;
  title: string;
  transport_type: string;
  departure_date: string | null;
  departure_location: string | null;
  arrival_location: string | null;
}

interface Document {
  id: string;
  title: string;
  category: string;
  file_type: string;
  created_at: string;
}

export default function ViagemPublica() {
  const { slug } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [locations, setLocations] = useState<TripLocation[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTripData() {
      if (!slug) return;

      try {
        // Buscar viagem pública
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('public_slug', slug)
          .eq('is_public', true)
          .single();

        if (tripError || !tripData) {
          setError('Viagem não encontrada ou não está pública');
          setLoading(false);
          return;
        }

        setTrip(tripData);

        // Buscar dados relacionados em paralelo
        const [locationsRes, accommodationsRes, restaurantsRes, transportsRes, documentsRes] = await Promise.all([
          supabase.from('trip_locations').select('*').eq('trip_id', tripData.id).order('order_index'),
          supabase.from('accommodations').select('*').eq('trip_id', tripData.id),
          supabase.from('restaurants').select('*').eq('trip_id', tripData.id),
          supabase.from('transport_bookings').select('*').eq('trip_id', tripData.id),
          supabase.from('trip_documents').select('*').eq('trip_id', tripData.id)
        ]);

        setLocations(locationsRes.data || []);
        setAccommodations(accommodationsRes.data || []);
        setRestaurants(restaurantsRes.data || []);
        setTransports(transportsRes.data || []);
        setDocuments(documentsRes.data || []);
      } catch (err) {
        setError('Erro ao carregar dados da viagem');
      } finally {
        setLoading(false);
      }
    }

    loadTripData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando viagem...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Viagem não encontrada</h1>
          <p className="text-muted-foreground">
            {error || 'Esta viagem não existe ou não está disponível publicamente.'}
          </p>
        </Card>
      </div>
    );
  }

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return 'Data não definida';
    const start = format(parseISO(startDate), "dd/MM/yyyy", { locale: ptBR });
    if (!endDate) return start;
    const end = format(parseISO(endDate), "dd/MM/yyyy", { locale: ptBR });
    return `${start} - ${end}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          {trip.images && trip.images.length > 0 && (
            <div className="relative h-64 rounded-lg overflow-hidden mb-6">
              <img
                src={trip.images[0]}
                alt={trip.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{trip.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.destination}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                </div>
              </div>
              {trip.description && (
                <p className="text-lg text-muted-foreground mb-4">{trip.description}</p>
              )}
            </div>
            
            <div className="text-right">
              <Badge variant={trip.status === 'completed' ? 'default' : 'secondary'}>
                {trip.status === 'planned' ? 'Planejada' : 
                 trip.status === 'ongoing' ? 'Em andamento' : 
                 trip.status === 'completed' ? 'Concluída' : trip.status}
              </Badge>
              {trip.total_budget > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Orçamento: {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: trip.budget_currency
                  }).format(trip.total_budget)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Locais */}
          {locations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Locais da Viagem
              </h2>
              <div className="space-y-3">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {location.location_type}
                    </Badge>
                    <span className="font-medium">{location.location_name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Hospedagens */}
          {accommodations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Hospedagens
              </h2>
              <div className="space-y-4">
                {accommodations.map((accommodation) => (
                  <div key={accommodation.id} className="flex gap-3">
                    {accommodation.hotel_image_url && (
                      <img
                        src={accommodation.hotel_image_url}
                        alt={accommodation.hotel_name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{accommodation.hotel_name}</h3>
                      <p className="text-sm text-muted-foreground">{accommodation.city}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateRange(accommodation.check_in_date, accommodation.check_out_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Restaurantes */}
          {restaurants.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Restaurantes
              </h2>
              <div className="space-y-4">
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex gap-3">
                    {restaurant.restaurant_image_url && (
                      <img
                        src={restaurant.restaurant_image_url}
                        alt={restaurant.restaurant_name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{restaurant.restaurant_name}</h3>
                      {restaurant.cuisine_type && (
                        <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
                      )}
                      {restaurant.reservation_date && (
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(restaurant.reservation_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Transporte */}
          {transports.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Transportes
              </h2>
              <div className="space-y-4">
                {transports.map((transport) => (
                  <div key={transport.id}>
                    <h3 className="font-semibold">{transport.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {transport.transport_type}
                      </Badge>
                      {transport.departure_date && (
                        <span>{format(parseISO(transport.departure_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      )}
                    </div>
                    {transport.departure_location && transport.arrival_location && (
                      <p className="text-sm text-muted-foreground">
                        {transport.departure_location} → {transport.arrival_location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Documentos (apenas contagem) */}
        {documents.length > 0 && (
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </h2>
            <p className="text-muted-foreground">
              Esta viagem possui {documents.length} documento{documents.length !== 1 ? 's' : ''} anexado{documents.length !== 1 ? 's' : ''}.
            </p>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Esta viagem foi compartilhada publicamente pelo organizador.</p>
        </div>
      </div>
    </div>
  );
}