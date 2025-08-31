import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search } from "lucide-react";

interface ProcessingStateProps {
  selectedImage?: string | null;
}

export default function ProcessingState({ selectedImage }: ProcessingStateProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 text-center">
        {selectedImage ? (
          <div className="relative mb-6">
            <img
              src={selectedImage}
              alt="Plant image being analyzed"
              className="w-full h-48 object-cover rounded-md image-processing"
            />
            
            {/* Scanning Line Effect */}
            <div className="scanning-line"></div>
            
            {/* Floating Particles */}
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            <div className="floating-particle"></div>
            
            {/* Enhanced Magnifying Glass Animation Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-md flex items-center justify-center">
              <div className="absolute inset-0 overflow-hidden rounded-md">
                {/* Dynamic Magnifying Glass */}
                <div className="absolute w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/60 rounded-full border-2 border-primary flex items-center justify-center magnifying-glass-animation backdrop-blur-sm">
                  {/* Lens with inner glow */}
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/40 to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 bg-white/90 rounded-full shadow-inner"></div>
                  </div>
                  
                  {/* Handle with gradient */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-6 bg-gradient-to-b from-primary to-primary/60 rotate-45 origin-top shadow-lg"></div>
                  
                  {/* Sparkle effect */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Additional scanning effects */}
            <div className="absolute top-0 left-0 w-full h-full rounded-md">
              {/* Corner scan indicators */}
              <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-primary/60"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-primary/60"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-primary/60"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-primary/60"></div>
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-primary text-2xl animate-pulse" />
          </div>
        )}
        
        <h3 className="text-xl font-semibold text-foreground mb-2 animate-pulse">
          🔍 Analyzing Your Plant
        </h3>
        <p className="text-muted-foreground mb-6 animate-pulse">
          Our AI is examining the image for disease indicators...
        </p>
        
        {/* Enhanced Progress Bar */}
        <div className="relative">
          <Progress value={65} className="w-full h-3" data-testid="progress-analysis" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse rounded-full"></div>
        </div>
        
        {/* Status indicators */}
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </CardContent>
    </Card>
  );
}
