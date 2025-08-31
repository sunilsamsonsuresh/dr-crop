import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { analyzeImage } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Images, Camera, X, Search, Loader2, Leaf } from "lucide-react";
import { AnalysisResult } from "@shared/schema";
import CameraModal from "@/components/camera-modal";
import { apiRequest } from "@/lib/queryClient";
import AnalysisDetailModal from "@/components/analysis-detail-modal";
import { Analysis } from "@shared/schema";

interface UploadSectionProps {
  onImageSelect: (file: File) => void;
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  selectedImage: File | null;
}

export default function UploadSection({ 
  onImageSelect, 
  onAnalysisStart, 
  onAnalysisComplete, 
  selectedImage 
}: UploadSectionProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Fetch user stats to show activity counter
  const { data: userStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/user/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/stats');
      return response.json();
    },
  });

  // Fetch user analyses to show recent scans
  const { data: analyses, refetch: refetchAnalyses } = useQuery({
    queryKey: ['/api/analyses'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analyses');
      return response.json();
    },
  });

  const analysisMutation = useMutation({
    mutationFn: analyzeImage,
    onMutate: () => {
      setIsAnalyzing(true);
    },
    onSuccess: (result) => {
      setIsAnalyzing(false);
      // Refetch stats and analyses to update counts
      refetchStats();
      refetchAnalyses();
      onAnalysisComplete(result);
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPEG, PNG)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image must be smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      onImageSelect(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowPreview(true);
    }
  };

  const handleCameraCapture = (file: File) => {
    onImageSelect(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowPreview(true);
    setShowCamera(false);
  };

  const handleRemoveImage = () => {
    setShowPreview(false);
    setIsAnalyzing(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onImageSelect(null as any);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (!selectedImage) return;
    
    onAnalysisStart();
    analysisMutation.mutate(selectedImage);
  };

  return (
    <>
      <div className="mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Diagnose Your Crops</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload or capture a photo of your plant to get instant disease analysis and treatment recommendations.
          </p>
        </div>

        {/* Activity Counter */}
        <div className="max-w-2xl mx-auto mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Leaf className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Your Activity</p>
                  <p className="text-sm text-muted-foreground">
                    {userStats?.scansToday || 0} scans today
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {analyses?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Scans</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            {!showPreview ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gallery Upload */}
                <label htmlFor="gallery-upload" className="cursor-pointer group">
                  <div className="border-2 border-dashed border-border hover:border-primary transition-colors rounded-lg p-8 text-center group-hover:bg-muted/50">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Images className="text-primary text-xl" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Choose from Gallery</h3>
                    <p className="text-sm text-muted-foreground">Select existing photos</p>
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    id="gallery-upload" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileSelect}
                    data-testid="input-gallery-upload"
                  />
                </label>

                {/* Camera Capture */}
                <Button
                  variant="outline"
                  className="h-auto p-8 border-2 border-dashed hover:border-primary"
                  onClick={() => setShowCamera(true)}
                  data-testid="button-camera-capture"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Camera className="text-accent text-xl" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Take Photo</h3>
                    <p className="text-sm text-muted-foreground">Use device camera</p>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">Selected Image</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-muted-foreground hover:text-destructive"
                    data-testid="button-remove-image"
                    disabled={isAnalyzing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  {previewUrl && (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Selected plant image for analysis"
                        className={`w-full h-48 object-cover rounded-md transition-all duration-300 ${
                          isAnalyzing ? 'blur-sm filter' : ''
                        }`}
                        data-testid="img-preview"
                      />
                      {/* Scanning Animation Overlay */}
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-primary/10 rounded-md flex items-center justify-center">
                          <div className="absolute inset-0 overflow-hidden rounded-md">
                            {/* Magnifying Glass Animation */}
                            <div className="absolute w-12 h-12 bg-primary/20 rounded-full border-2 border-primary flex items-center justify-center magnifying-glass-animation">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                              </div>
                              {/* Handle */}
                              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-primary rotate-45 origin-top"></div>
                            </div>
                          </div>
                          <div className="relative z-10 bg-background/80 rounded-lg p-4 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-sm font-medium text-foreground">Analyzing...</p>
                            <p className="text-xs text-muted-foreground">AI is examining your plant</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedImage || isAnalyzing}
                  className="w-full mt-4"
                  data-testid="button-analyze"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze Plant
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans Section */}
        {analyses && analyses.length > 0 && (
          <div className="max-w-2xl mx-auto mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Scans</h3>
              <div className="space-y-3">
                {analyses.slice(0, 3).map((analysis: Analysis) => (
                  <div 
                    key={analysis.id} 
                    className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => {
                      setSelectedAnalysis(analysis);
                      setShowAnalysisModal(true);
                    }}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Leaf className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {analysis.disease}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString()} • {analysis.severity} severity
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <CameraModal
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <AnalysisDetailModal
          analysis={selectedAnalysis}
          isOpen={showAnalysisModal}
          onClose={() => {
            setShowAnalysisModal(false);
            setSelectedAnalysis(null);
          }}
        />
      )}
    </>
  );
}
