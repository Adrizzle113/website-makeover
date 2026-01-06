import { useState } from "react";
import { Navigation, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface GeoSearchInputProps {
  latitude: number | undefined;
  longitude: number | undefined;
  radius: number;
  onLatitudeChange: (value: number | undefined) => void;
  onLongitudeChange: (value: number | undefined) => void;
  onRadiusChange: (value: number) => void;
  className?: string;
}

export function GeoSearchInput({
  latitude,
  longitude,
  radius,
  onLatitudeChange,
  onLongitudeChange,
  onRadiusChange,
  className,
}: GeoSearchInputProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLatitudeChange(position.coords.latitude);
        onLongitudeChange(position.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please enter coordinates manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const radiusKm = radius / 1000;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="latitude" className="text-xs text-muted-foreground">
            Latitude
          </Label>
          <Input
            id="latitude"
            type="number"
            step="0.0001"
            value={latitude ?? ""}
            onChange={(e) => onLatitudeChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="34.0522"
            className="h-10"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="longitude" className="text-xs text-muted-foreground">
            Longitude
          </Label>
          <Input
            id="longitude"
            type="number"
            step="0.0001"
            value={longitude ?? ""}
            onChange={(e) => onLongitudeChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="-118.2437"
            className="h-10"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            title="Use my current location"
            className="h-10 w-10"
          >
            <Navigation className={cn("h-4 w-4", isLocating && "animate-pulse")} />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs text-muted-foreground">Search Radius</Label>
          <span className="text-sm font-medium">{radiusKm} km</span>
        </div>
        <Slider
          value={[radius]}
          onValueChange={([value]) => onRadiusChange(value)}
          min={1000}
          max={20000}
          step={1000}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 km</span>
          <span>20 km</span>
        </div>
      </div>

      {latitude !== undefined && longitude !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
          <MapPin className="h-4 w-4" />
          <span>
            Searching within {radiusKm}km of [{latitude.toFixed(4)}, {longitude.toFixed(4)}]
          </span>
        </div>
      )}
    </div>
  );
}
