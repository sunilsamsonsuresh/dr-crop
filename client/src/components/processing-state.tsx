import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Microscope } from "lucide-react";

export default function ProcessingState() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Microscope className="text-primary text-2xl animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Analyzing Your Plant</h3>
        <p className="text-muted-foreground mb-6">Our AI is examining the image for disease indicators...</p>
        <Progress value={65} className="w-full" data-testid="progress-analysis" />
      </CardContent>
    </Card>
  );
}
