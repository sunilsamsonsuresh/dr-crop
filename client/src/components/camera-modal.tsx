import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to capture photos",
        variant: "destructive",
      });
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `plant-image-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          onCapture(file);
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const switchCamera = async () => {
    try {
      stopCamera();
      
      // Try to switch between front and back cameras
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: stream ? 'user' : 'environment', // Toggle between user and environment
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera switch error:', error);
      toast({
        title: "Camera Switch Failed",
        description: "Could not switch camera. Using current camera.",
        variant: "destructive",
      });
      // Fallback to original camera
      startCamera();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Capture Plant Photo</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          {/* Camera Preview Area */}
          <div className="bg-muted/30 rounded-lg overflow-hidden mb-4 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
              data-testid="video-camera-preview"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="text-4xl text-muted-foreground mb-2 mx-auto" size={48} />
                  <p className="text-muted-foreground">Starting camera...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Camera Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={capturePhoto}
              disabled={!stream || isCapturing}
              className="w-12 h-12 rounded-full"
              data-testid="button-capture-photo"
            >
              <Camera className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              onClick={switchCamera}
              disabled={!stream}
              className="w-12 h-12 rounded-full"
              data-testid="button-switch-camera"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
