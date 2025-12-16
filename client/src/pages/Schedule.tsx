import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Calendar, FileUp, MapPin, Upload, ExternalLink, Navigation } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Heilbronn building addresses mapping
const HEILBRONN_ADDRESSES: Record<string, string> = {
  // Rooms starting with digits or L → Etzelstraße
  'etzelstrasse': 'Etzelstraße 38, 74076 Heilbronn, Germany',
  // Rooms starting with D → Bildungscampus
  'bildungscampus': 'Bildungscampus 2, 74076 Heilbronn, Germany',
  // Rooms starting with C → Weipertstraße
  'weipertstrasse': 'Weipertstraße 8-10, 74076 Heilbronn, Germany',
};

function getHeilbronnAddress(location: string): string | null {
  if (!location) return null;
  
  // Extract room code from location (e.g., "L.1.11" from "L.1.11, Seminarraum (1902.01.111)")
  const roomMatch = location.match(/^([A-Z]\.[\d.]+|\d+(?:\.\d+)*)/i);
  const roomCode = roomMatch ? roomMatch[1].toUpperCase() : '';
  
  // Check room prefix
  if (/^\d/.test(roomCode) || roomCode.startsWith('L')) {
    return HEILBRONN_ADDRESSES.etzelstrasse;
  }
  if (roomCode.startsWith('D')) {
    return HEILBRONN_ADDRESSES.bildungscampus;
  }
  if (roomCode.startsWith('C')) {
    return HEILBRONN_ADDRESSES.weipertstrasse;
  }
  
  // Check for Heilbronn building codes in parentheses
  if (location.includes('1901.') || location.includes('1902.')) {
    return HEILBRONN_ADDRESSES.bildungscampus;
  }
  if (location.includes('1910.') || location.includes('1915.')) {
    return HEILBRONN_ADDRESSES.weipertstrasse;
  }
  
  return null;
}

export default function Schedule() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<{
    courseName: string;
    location: string;
    buildingName?: string;
    fullAddress?: string;
  } | null>(null);
  
  const { data: courses, refetch } = trpc.courses.list.useQuery();
  const importMutation = trpc.courses.import.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.count} courses`);
      refetch();
      setFile(null);
    },
    onError: (error) => {
      toast.error(`Failed to import calendar: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      importMutation.mutate({ icsContent: content });
    };
    reader.readAsText(file);
  };

  const handleViewOnMap = (course: { courseName: string; location?: string | null; buildingName?: string | null }) => {
    if (!course.location) {
      toast.error("No location available for this course");
      return;
    }
    
    // Try to get Heilbronn address first
    const heilbronnAddress = getHeilbronnAddress(course.location);
    
    setSelectedCourse({
      courseName: course.courseName,
      location: course.location,
      buildingName: course.buildingName || undefined,
      fullAddress: heilbronnAddress || undefined,
    });
  };

  const openInGoogleMaps = (address: string) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openDirections = (address: string) => {
    const destination = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  const groupedCourses = courses?.reduce((acc, course) => {
    const date = new Date(course.startTime).toLocaleDateString("de-DE");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(course);
    return acc;
  }, {} as Record<string, typeof courses>);

  // Get the address to use for map display
  const getMapAddress = () => {
    if (selectedCourse?.fullAddress) {
      return selectedCourse.fullAddress;
    }
    return selectedCourse?.location + ', Germany';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Course Schedule
          </h1>
          <p className="text-muted-foreground">
            Import and manage your TUM course calendar
          </p>
        </div>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Import Calendar
            </CardTitle>
            <CardDescription>
              Upload your TUM course schedule (.ics file) to sync your classes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendar-file">Calendar File (.ics)</Label>
              <div className="flex gap-2">
                <Input
                  id="calendar-file"
                  type="file"
                  accept=".ics"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  onClick={handleImport}
                  disabled={!file || importMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importMutation.isPending ? "Importing..." : "Import"}
                </Button>
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">How to get your TUM calendar:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Log in to TUMonline</li>
                <li>Go to "Mein Stundenplan" (My Schedule)</li>
                <li>Click on "Export" and select "iCal Format"</li>
                <li>Upload the downloaded .ics file here</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Course List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Courses</h2>
          {courses && courses.length > 0 ? (
            <div className="space-y-6">
              {groupedCourses && Object.entries(groupedCourses)
                .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                .slice(0, 7) // Show next 7 days
                .map(([date, dayCourses]) => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
                      {date}
                    </h3>
                    <div className="space-y-3">
                      {dayCourses?.sort((a, b) => 
                        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                      ).map((course, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col items-center min-w-[80px] bg-primary/10 rounded-lg p-2">
                                <span className="text-sm font-semibold text-primary">
                                  {new Date(course.startTime).toLocaleTimeString("de-DE", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="text-xs text-muted-foreground">to</span>
                                <span className="text-sm font-semibold text-primary">
                                  {new Date(course.endTime).toLocaleTimeString("de-DE", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{course.courseName}</h4>
                                {course.courseCode && (
                                  <p className="text-sm text-muted-foreground">{course.courseCode}</p>
                                )}
                                {course.location && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                                    <MapPin className="h-4 w-4" />
                                    {course.location}
                                  </p>
                                )}
                                {course.buildingName && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {course.buildingName}
                                  </p>
                                )}
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewOnMap(course)}
                                disabled={!course.location}
                              >
                                <MapPin className="h-4 w-4 mr-1" />
                                View on Map
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No courses imported yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload your TUM calendar file to see your schedule
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Map Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedCourse?.courseName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">Room</p>
              <p className="text-muted-foreground">{selectedCourse?.location}</p>
              {selectedCourse?.buildingName && (
                <p className="text-sm text-primary mt-1">
                  Building: {selectedCourse.buildingName}
                </p>
              )}
              {selectedCourse?.fullAddress && (
                <p className="text-sm font-medium text-green-600 mt-2">
                  📍 {selectedCourse.fullAddress}
                </p>
              )}
            </div>
            
            {/* Embedded Google Maps */}
            {selectedCourse?.location && (
              <div className="aspect-video w-full rounded-lg overflow-hidden border">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(getMapAddress())}`}
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => selectedCourse && openInGoogleMaps(getMapAddress())}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Maps
              </Button>
              <Button 
                variant="secondary"
                className="flex-1"
                onClick={() => selectedCourse && openDirections(getMapAddress())}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </div>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setSelectedCourse(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
