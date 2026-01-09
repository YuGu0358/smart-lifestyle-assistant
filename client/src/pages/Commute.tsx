import DashboardLayout from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { TUM_CAMPUSES, type TUMLocation } from "@shared/tumLocations";
import { HEILBRONN_BUILDINGS } from "@shared/heilbronnLocations";
import { Bus, Clock, Home, MapPin, Navigation, Sparkles, LocateFixed } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function Commute() {
  const { data: profile } = trpc.wellness.get.useQuery();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const [from, setFrom] = useState<{ name: string; lat: number; lng: number }>({
    name: "",
    lat: 48.1351,
    lng: 11.5820,
  }); // Munich center
  const [to, setTo] = useState<{ name: string; lat: number; lng: number }>({
    name: "",
    lat: 48.2627,
    lng: 11.6679,
  }); // TUM Garching
  const [arrivalTime, setArrivalTime] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const planMutation = trpc.commutes.plan.useMutation({
    onError: (error) => {
      toast.error(`Failed to plan commute: ${error.message}`);
    },
  });

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Initialize DirectionsRenderer
    const renderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#2563eb",
        strokeWeight: 5,
        strokeOpacity: 0.7,
      },
    });
    setDirectionsRenderer(renderer);

    // Add campus markers (TUM + Heilbronn)
    const campusMarkers: google.maps.Marker[] = [];
    
    // Add Heilbronn buildings
    Object.values(HEILBRONN_BUILDINGS).forEach((building) => {
      if (building.coordinates) {
        const marker = new google.maps.Marker({
          position: { lat: building.coordinates.lat, lng: building.coordinates.lng },
          map: map,
          title: building.name,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(40, 40),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${building.name}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Heilbronn Campus</p>
              <p style="font-size: 11px; color: #888;">${building.fullAddress}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        campusMarkers.push(marker);
      }
    });
    
    // Add TUM campuses
    TUM_CAMPUSES.forEach((location) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new google.maps.Size(40, 40),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${location.name}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${location.campus} Campus</p>
            <p style="font-size: 11px; color: #888;">${location.address}</p>
            ${location.description ? `<p style="font-size: 11px; margin-top: 4px;">${location.description}</p>` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      campusMarkers.push(marker);
    });

    setMarkers(campusMarkers);

    // Set initial view to show all TUM campuses
    const bounds = new google.maps.LatLngBounds();
    TUM_CAMPUSES.forEach((loc) => {
      bounds.extend({ lat: loc.lat, lng: loc.lng });
    });
    map.fitBounds(bounds);
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          name: "My Current Location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setFrom(userPos);
        
        // Center map on user location
        if (mapRef.current) {
          mapRef.current.setCenter({ lat: userPos.lat, lng: userPos.lng });
          mapRef.current.setZoom(15);
        }
        
        toast.success("Location set to your current position");
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Failed to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleTUMLocationSelect = (locationId: string, isDestination: boolean) => {
    // Check if it's a Heilbronn building
    if (locationId.startsWith('heilbronn-')) {
      const buildingId = locationId.replace('heilbronn-', '');
      const building = HEILBRONN_BUILDINGS[buildingId];
      if (building && building.coordinates) {
        if (isDestination) {
          setTo({ name: building.name, lat: building.coordinates.lat, lng: building.coordinates.lng });
        } else {
          setFrom({ name: building.name, lat: building.coordinates.lat, lng: building.coordinates.lng });
        }
        
        // Focus map on Heilbronn
        if (mapRef.current) {
          mapRef.current.setCenter({ lat: building.coordinates.lat, lng: building.coordinates.lng });
          mapRef.current.setZoom(15);
        }
        return;
      }
    }
    
    // Otherwise check TUM campuses
    const location = TUM_CAMPUSES.find((loc) => loc.id === locationId);
    if (location) {
      if (isDestination) {
        setTo({ name: location.name, lat: location.lat, lng: location.lng });
      } else {
        setFrom({ name: location.name, lat: location.lat, lng: location.lng });
      }

      // Center map on selected location
      if (mapRef.current) {
        mapRef.current.panTo({ lat: location.lat, lng: location.lng });
        mapRef.current.setZoom(15);
      }
    }
  };

  const handlePlan = () => {
    if (!from.name || !to.name || !arrivalTime) {
      toast.error("Please fill in all fields");
      return;
    }

    planMutation.mutate({
      fromName: from.name,
      fromLat: from.lat,
      fromLng: from.lng,
      toName: to.name,
      toLat: to.lat,
      toLng: to.lng,
      arrivalTime: new Date(arrivalTime).toISOString(),
      userPace: "average",
    });

    // Draw route on map using Directions API
    if (mapRef.current && directionsRenderer) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: from.lat, lng: from.lng },
          destination: { lat: to.lat, lng: to.lng },
          travelMode: google.maps.TravelMode.TRANSIT,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRenderer.setDirections(result);
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Navigation className="h-8 w-8" />
            Commute Planner
          </h1>
          <p className="text-muted-foreground">
            Get smart route suggestions with real-time MVV data
          </p>
        </div>

        {/* Map */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[400px] w-full">
              <MapView 
                onMapReady={handleMapReady} 
                showUserLocation={true}
                centerOnUserLocation={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Planning Form */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Your Commute</CardTitle>
            <CardDescription>
              Select TUM locations or enter custom addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Select onValueChange={(value) => handleTUMLocationSelect(value, false)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select TUM location or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Address</SelectItem>
                    {Object.values(HEILBRONN_BUILDINGS).map((building) => (
                      <SelectItem key={building.id} value={`heilbronn-${building.id}`}>
                        {building.name} (Heilbronn)
                      </SelectItem>
                    ))}
                    {TUM_CAMPUSES.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.campus})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="from"
                  placeholder="e.g., Marienplatz"
                  value={from.name}
                  onChange={(e) => setFrom({ ...from, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Select onValueChange={(value) => handleTUMLocationSelect(value, true)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select TUM location or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Address</SelectItem>
                    {Object.values(HEILBRONN_BUILDINGS).map((building) => (
                      <SelectItem key={building.id} value={`heilbronn-${building.id}`}>
                        {building.name} (Heilbronn)
                      </SelectItem>
                    ))}
                    {TUM_CAMPUSES.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} ({loc.campus})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="to"
                  placeholder="e.g., TUM Garching"
                  value={to.name}
                  onChange={(e) => setTo({ ...to, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival Time</Label>
              <Input
                id="arrival"
                type="datetime-local"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleUseCurrentLocation}
                disabled={isGettingLocation}
                className="flex-1"
              >
                <LocateFixed className="h-4 w-4 mr-2" />
                {isGettingLocation ? "Getting Location..." : "Use My Location"}
              </Button>
              {profile?.homeAddress && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFrom({ name: profile.homeAddress || "", lat: 0, lng: 0 });
                    toast.success("Set departure to your home address");
                  }}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  From Home
                </Button>
              )}
              <Button onClick={handlePlan} disabled={planMutation.isPending} className="flex-1">
                <MapPin className="h-4 w-4 mr-2" />
                {planMutation.isPending ? "Planning..." : "Find Routes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Advice */}
        {planMutation.data?.aiAdvice && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Commute Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <Streamdown>{planMutation.data.aiAdvice}</Streamdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Results */}
        {planMutation.isPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : planMutation.data?.routes && planMutation.data.routes.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Route Options</h2>
            {planMutation.data.routes.map((route, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Route {index + 1}
                      {index === 0 && (
                        <span className="ml-2 text-sm font-normal text-primary">
                          (Recommended)
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{route.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{route.changes} transfers</span>
                      </div>
                    </div>
                  </div>
                  <CardDescription>
                    Depart:{" "}
                    {new Date(route.departure).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    • Arrive:{" "}
                    {new Date(route.arrival).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {route.legs.map((leg, legIndex) => (
                      <div
                        key={legIndex}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex flex-col items-center min-w-[60px]">
                          <span className="text-xs text-muted-foreground">
                            {new Date(leg.departure).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <div className="h-8 w-0.5 bg-border my-1" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(leg.arrival).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {leg.walking ? (
                              <span className="text-sm px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                🚶 Walk
                              </span>
                            ) : leg.line ? (
                              <span className="text-sm px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                                {leg.line.name}
                              </span>
                            ) : null}
                            {leg.direction && (
                              <span className="text-xs text-muted-foreground">
                                → {leg.direction}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">{leg.origin.name}</span>
                            <span className="text-muted-foreground"> → </span>
                            <span className="font-medium">{leg.destination.name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {leg.duration} minutes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Save Route
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
