import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UtensilsCrossed, MapPinPlus, MoreVertical, ExternalLink, Map, Globe, Navigation } from "lucide-react";

interface QuickActionButtonsProps {
  message: string;
  tripId: string;
}

const ConciergeActionButtons = memo(({ message, tripId }: QuickActionButtonsProps) => {
  const navigate = useNavigate();

  const extractedData = useMemo(() => {
    // Simplified extraction logic - only check for basic patterns
    const containsRestaurant = /restaurante|comida|culinária|gastronomia|prato|comer|jantar|almoçar|café da manhã|food|restaurant/i.test(message);
    const containsAttraction = /vinícola|atração|ponto turístico|visitar|museu|parque|monumento|igreja|teatro|shopping|mercado|praia|trilha|passeio|winery|attraction/i.test(message);

    let restaurants: any[] = [];
    let attractions: any[] = [];

    // Try to extract JSON data first (fastest method)
    try {
      const jsonBlock = message.match(/```json\s*([\s\S]*?)```/i);
      if (jsonBlock?.[1]) {
        const parsed = JSON.parse(jsonBlock[1]);
        if (parsed?.restaurant) {
          restaurants.push({
            name: parsed.restaurant.name || "",
            description: parsed.restaurant.description || "",
            cuisine: parsed.restaurant.cuisine || "",
            address: parsed.restaurant.address || "",
            link: parsed.restaurant.link || "",
            tripadvisor: parsed.restaurant.tripadvisor || "",
            gmap: parsed.restaurant.gmap || "",
            waze: parsed.restaurant.waze || "",
            estimated_amount: parsed.restaurant.estimated_amount || ""
          });
        }
        if (parsed?.itinerary_item) {
          attractions.push({
            name: parsed.itinerary_item.title || "",
            description: parsed.itinerary_item.description || "",
            category: parsed.itinerary_item.category || "attraction",
            location: parsed.itinerary_item.location || ""
          });
        }
      }
    } catch (e) {
      // Fallback to simple text extraction only if JSON fails
      if (containsRestaurant) {
        const nameMatch = message.match(/\*\*([A-Z][A-Za-z0-9'\-\s]+?)\*\*/);
        if (nameMatch) {
          restaurants.push({
            name: nameMatch[1].trim(),
            description: "Sugerido pelo concierge",
            cuisine: "",
            address: "",
            link: "",
            tripadvisor: "",
            gmap: "",
            waze: "",
            estimated_amount: ""
          });
        }
      }
      if (containsAttraction) {
        const nameMatch = message.match(/\*\*([A-Z][A-Za-z0-9'\-\s]+?)\*\*/);
        if (nameMatch) {
          attractions.push({
            name: nameMatch[1].trim(),
            description: "Sugerido pelo concierge",
            category: "attraction",
            location: ""
          });
        }
      }
    }

    return { restaurants, attractions };
  }, [message]);

  const handleAddRestaurant = (restaurant: any) => {
    const params = new URLSearchParams();
    Object.entries(restaurant).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    params.set('fromConcierge', 'true');
    params.set('source', message.slice(0, 1000));
    
    navigate(`/viagem/${tripId}/restaurantes/novo?${params.toString()}`);
  };

  const handleAddAttraction = (attraction: any) => {
    const params = new URLSearchParams({
      title: attraction.name,
      description: attraction.description || '',
      category: attraction.category || 'attraction',
      fromConcierge: 'true'
    });
    if (attraction.location) params.set('location', attraction.location);
    navigate(`/viagem/${tripId}/roteiro?${params.toString()}`);
  };

  const openExternalLink = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Get the first restaurant with links for external buttons
  const restaurantWithLinks = extractedData.restaurants.find(r => 
    r.tripadvisor || r.gmap || r.link || r.waze
  );

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-8 px-3 text-xs gap-1">
              Salvar como
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="w-56 z-50 bg-background border shadow-lg">
            <DropdownMenuItem
              onClick={() => {
                if (extractedData.restaurants.length > 0) {
                  handleAddRestaurant(extractedData.restaurants[0]);
                } else {
                  const params = new URLSearchParams({ fromConcierge: 'true' });
                  navigate(`/viagem/${tripId}/restaurantes/novo?${params.toString()}`);
                }
              }}
              className="cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              {`Restaurante${
                extractedData.restaurants.length > 0 && extractedData.restaurants[0].name
                  ? ` – ${extractedData.restaurants[0].name}`
                  : ''
              }`}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (extractedData.attractions.length > 0) {
                  handleAddAttraction(extractedData.attractions[0]);
                } else {
                  const params = new URLSearchParams({ fromConcierge: 'true' });
                  navigate(`/viagem/${tripId}/roteiro?${params.toString()}`);
                }
              }}
              className="cursor-pointer"
            >
              <MapPinPlus className="w-4 h-4 mr-2" />
              {`Roteiro${
                extractedData.attractions.length > 0 && extractedData.attractions[0].name
                  ? ` – ${extractedData.attractions[0].name}`
                  : ''
              }`}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* External Link Buttons */}
        {restaurantWithLinks && (
          <>
            {restaurantWithLinks.link && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs gap-1"
                onClick={() => openExternalLink(restaurantWithLinks.link)}
              >
                <Globe className="w-3 h-3" />
                Site
              </Button>
            )}
            {restaurantWithLinks.tripadvisor && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs gap-1"
                onClick={() => openExternalLink(restaurantWithLinks.tripadvisor)}
              >
                <ExternalLink className="w-3 h-3" />
                TripAdvisor
              </Button>
            )}
            {restaurantWithLinks.gmap && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs gap-1"
                onClick={() => openExternalLink(restaurantWithLinks.gmap)}
              >
                <Map className="w-3 h-3" />
                Google Maps
              </Button>
            )}
            {restaurantWithLinks.waze && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs gap-1"
                onClick={() => openExternalLink(restaurantWithLinks.waze)}
              >
                <Navigation className="w-3 h-3" />
                Waze
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

ConciergeActionButtons.displayName = "ConciergeActionButtons";

export { ConciergeActionButtons };