import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { analyzeImage } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { Images, Camera, X, Search } from "lucide-react";
import { AnalysisResult } from "@shared/schema";
import CameraModal from "./camera-modal";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: analyzeImage,
    onSuccess: (result) => {
      onAnalysisComplete(result);
    },
    onError: (error) => {
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
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Selected plant image for analysis"
                      className="w-full h-48 object-cover rounded-md"
                      data-testid="img-preview"
                    />
                  )}
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedImage || analysisMutation.isPending}
                  className="w-full mt-4"
                  data-testid="button-analyze"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {analysisMutation.isPending ? "Analyzing..." : "Analyze Plant"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CameraModal
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
