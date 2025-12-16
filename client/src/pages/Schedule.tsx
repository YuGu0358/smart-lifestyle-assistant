import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Calendar, FileUp, MapPin, Upload, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Schedule() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<{
    courseName: string;
    location: string;
    buildingName?: string;
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
    setSelectedCourse({
      courseName: course.courseName,
      location: course.location,
      buildingName: course.buildingName || undefined,
    });
  };

  const openInGoogleMaps = (location: string) => {
    const query = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const groupedCourses = courses?.reduce((acc, course) => {
    const date = new Date(course.startTime).toLocaleDateString("de-DE");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(course);
    return acc;
  }, {} as Record<string, typeof courses>);

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
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">{selectedCourse?.location}</p>
              {selectedCourse?.buildingName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Building: {selectedCourse.buildingName}
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
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(selectedCourse.location + ', Germany')}`}
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => selectedCourse && openInGoogleMaps(selectedCourse.location)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedCourse(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
