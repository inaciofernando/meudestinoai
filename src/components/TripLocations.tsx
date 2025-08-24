import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, X, GripVertical } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface TripLocation {
  id?: string
  location_name: string
  location_type: string
  order_index: number
  notes?: string
}

interface TripLocationsProps {
  locations: TripLocation[]
  onChange: (locations: TripLocation[]) => void
  disabled?: boolean
}

export function TripLocations({ locations, onChange, disabled = false }: TripLocationsProps) {
  const [newLocation, setNewLocation] = useState("")
  const [newLocationType, setNewLocationType] = useState("city")

  const addLocation = () => {
    if (newLocation.trim()) {
      const location: TripLocation = {
        location_name: newLocation.trim(),
        location_type: newLocationType,
        order_index: locations.length
      }
      onChange([...locations, location])
      setNewLocation("")
    }
  }

  const removeLocation = (index: number) => {
    const updatedLocations = locations.filter((_, i) => i !== index)
      .map((loc, i) => ({ ...loc, order_index: i }))
    onChange(updatedLocations)
  }

  const moveLocation = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= locations.length) return
    
    const updatedLocations = [...locations]
    const [movedLocation] = updatedLocations.splice(fromIndex, 1)
    updatedLocations.splice(toIndex, 0, movedLocation)
    
    // Update order indexes
    const reorderedLocations = updatedLocations.map((loc, i) => ({ 
      ...loc, 
      order_index: i 
    }))
    onChange(reorderedLocations)
  }

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'city': return 'Cidade'
      case 'region': return 'Região'  
      case 'attraction': return 'Atração'
      case 'airport': return 'Aeroporto'
      default: return 'Cidade'
    }
  }

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'city': return 'default'
      case 'region': return 'secondary'
      case 'attraction': return 'outline'
      case 'airport': return 'destructive'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Locais da Viagem</Label>
        <p className="text-sm text-muted-foreground">
          Adicione os locais que você pretende visitar durante a viagem
        </p>
      </div>

      {/* Add new location */}
      {!disabled && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ex: Los Angeles, Vale do Silício, São Francisco..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                />
              </div>
              <Select value={newLocationType} onValueChange={setNewLocationType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">Cidade</SelectItem>
                  <SelectItem value="region">Região</SelectItem>
                  <SelectItem value="attraction">Atração</SelectItem>
                  <SelectItem value="airport">Aeroporto</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addLocation} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations list */}
      {locations.length > 0 && (
        <div className="space-y-2">
          {locations.map((location, index) => (
            <Card key={index} className="group">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {!disabled && (
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                        onClick={() => moveLocation(index, index - 1)}
                        disabled={index === 0}
                      >
                        ▲
                      </Button>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                        onClick={() => moveLocation(index, index + 1)}
                        disabled={index === locations.length - 1}
                      >
                        ▼
                      </Button>
                    </div>
                  )}
                  
                  <MapPin className="w-4 h-4 text-primary" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{location.location_name}</span>
                      <Badge variant={getLocationTypeColor(location.location_type) as any}>
                        {getLocationTypeLabel(location.location_type)}
                      </Badge>
                    </div>
                  </div>

                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLocation(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {locations.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum local adicionado ainda</p>
        </div>
      )}
    </div>
  )
}