import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UtensilsCrossed, MapPinPlus, MoreVertical, ExternalLink, Map, Globe, Navigation } from "lucide-react";

interface QuickActionButtonsProps {
  message: string;
  messageData?: { images?: Array<{ type: string; image: string }>; structuredData?: any };
  tripId: string;
}

const ConciergeActionButtons = memo(({ message, messageData, tripId }: QuickActionButtonsProps) => {
  const navigate = useNavigate();

  const extractedData = useMemo(() => {
    // Primeiro, tentar usar dados estruturados se disponíveis
    if (messageData?.structuredData) {
      let restaurants: any[] = [];
      let attractions: any[] = [];
      
      if (messageData.structuredData.restaurant) {
        restaurants.push({
          name: messageData.structuredData.restaurant.name || "",
          description: messageData.structuredData.restaurant.description || "",
          cuisine: messageData.structuredData.restaurant.cuisine || "",
          address: messageData.structuredData.restaurant.address || "",
          link: messageData.structuredData.restaurant.link || "",
          tripadvisor: messageData.structuredData.restaurant.tripadvisor || "",
          gmap: messageData.structuredData.restaurant.gmap || "",
          waze: messageData.structuredData.restaurant.waze || "",
          estimated_amount: messageData.structuredData.restaurant.estimated_amount || ""
        });
      }
      
      if (messageData.structuredData.itinerary_item) {
        attractions.push({
          name: messageData.structuredData.itinerary_item.title || "",
          description: messageData.structuredData.itinerary_item.description || "",
          category: messageData.structuredData.itinerary_item.category || "attraction",
          location: messageData.structuredData.itinerary_item.location || "",
          address: messageData.structuredData.itinerary_item.address || "",
          website: messageData.structuredData.itinerary_item.link || messageData.structuredData.itinerary_item.website_link || "",
          tripadvisor: messageData.structuredData.itinerary_item.tripadvisor_link || messageData.structuredData.itinerary_item.tripadvisor || "",
          gmap: messageData.structuredData.itinerary_item.google_maps_link || messageData.structuredData.itinerary_item.gmap || "",
          waze: messageData.structuredData.itinerary_item.waze_link || messageData.structuredData.itinerary_item.waze || ""
        });
      }
      
      return { restaurants, attractions };
    }

    // Fallback: lógica original de extração da string
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
            location: parsed.itinerary_item.location || "",
            address: parsed.itinerary_item.address || "",
            website: parsed.itinerary_item.link || parsed.itinerary_item.website_link || "",
            tripadvisor: parsed.itinerary_item.tripadvisor_link || parsed.itinerary_item.tripadvisor || "",
            gmap: parsed.itinerary_item.google_maps_link || parsed.itinerary_item.gmap || "",
            waze: parsed.itinerary_item.waze_link || parsed.itinerary_item.waze || ""
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
  }, [message, messageData]);

  const handleAddRestaurant = (restaurant: any) => {
    const params = new URLSearchParams();
    Object.entries(restaurant).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    params.set('fromConcierge', 'true');
    params.set('source', message.slice(0, 1000));
    
    // Salvar imagens relevantes no sessionStorage para o formulário
    const restaurantImages = messageData?.images?.filter(img => img.type === 'restaurant') || [];
    if (restaurantImages.length > 0) {
      const imageKey = `concierge_restaurant_images_${tripId}_${Date.now()}`;
      sessionStorage.setItem(imageKey, JSON.stringify(restaurantImages));
      params.set('imageKey', imageKey);
    }
    
    navigate(`/viagem/${tripId}/restaurantes/novo?${params.toString()}`);
  };

  const handleAddAttraction = (attraction: any) => {
    const params = new URLSearchParams({
      title: attraction.name,
      description: attraction.description || '',
      category: attraction.category || 'attraction',
      location: attraction.location || '',
      address: attraction.address || '',
      website: attraction.website || '',
      tripadvisor: attraction.tripadvisor || '',
      gmap: attraction.gmap || '',
      waze: attraction.waze || '',
      fromConcierge: 'true'
    });
    
    // Salvar imagens relevantes no sessionStorage para o formulário
    const attractionImages = messageData?.images?.filter(img => img.type === 'attraction') || [];
    if (attractionImages.length > 0) {
      const imageKey = `concierge_attraction_images_${tripId}_${Date.now()}`;
      sessionStorage.setItem(imageKey, JSON.stringify(attractionImages));
      params.set('imageKey', imageKey);
    }
    
    navigate(`/viagem/${tripId}/roteiro?${params.toString()}`);
  };

  const openExternalLink = (url: string, linkType?: string) => {
    if (url) {
      try {
        // Tentar abrir o link
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        // Verificar se o popup foi bloqueado
        if (!newWindow) {
          console.warn(`Popup bloqueado para ${linkType || 'link'}: ${url}`);
          // Tentar novamente como navegação direta
          window.location.href = url;
        }
      } catch (error) {
        console.error(`Erro ao abrir ${linkType || 'link'}:`, error);
        // Fallback: copiar para área de transferência
        navigator.clipboard?.writeText(url).then(() => {
          alert(`Link copiado para área de transferência: ${url}`);
        }).catch(() => {
          alert(`Não foi possível abrir o link: ${url}`);
        });
      }
    }
  };

  // Get the first restaurant with links for external buttons
  const restaurantWithLinks = extractedData.restaurants.find(r => 
    r.tripadvisor || r.gmap || r.link || r.waze
  );

  return (
    <div className="mt-4 px-4">
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
                onClick={() => openExternalLink(restaurantWithLinks.link, 'Site')}
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
                onClick={() => openExternalLink(restaurantWithLinks.tripadvisor, 'TripAdvisor')}
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
                onClick={() => openExternalLink(restaurantWithLinks.gmap, 'Google Maps')}
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
                onClick={() => openExternalLink(restaurantWithLinks.waze, 'Waze')}
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