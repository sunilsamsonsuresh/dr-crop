import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Leaf, 
  FlaskConical, 
  Shield, 
  CloudRain, 
  ClipboardList,
  Plus,
  Download,
  Calendar,
  Share,
  Info
} from "lucide-react";
import { AnalysisResult, UserStats } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ResultsDashboardProps {
  result: AnalysisResult;
  onNewScan: () => void;
}

export default function ResultsDashboard({ result, onNewScan }: ResultsDashboardProps) {
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/stats'],
    queryFn: async (): Promise<UserStats> => {
      const response = await apiRequest('GET', '/api/user/stats');
      return response.json();
    },
  });
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'none':
      case 'healthy':
        return 'bg-success';
      case 'mild':
        return 'bg-warning';
      case 'moderate':
        return 'bg-accent';
      case 'severe':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'none':
        return 'No Risk';
      case 'mild':
        return 'Mild Risk';
      case 'moderate':
        return 'Moderate Risk';
      case 'severe':
        return 'High Risk';
      default:
        return severity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Disease Identification Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1" data-testid="text-disease-name">
                {result.disease}
              </h2>
              <p className="text-primary-foreground/80">Disease Identified</p>
            </div>
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-primary-foreground text-xl" />
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">Severity Level</span>
              <span className="font-bold text-lg" data-testid="text-severity-percent">
                {result.severity_percent}%
              </span>
            </div>
            <Progress 
              value={result.severity_percent} 
              className="w-full h-3"
              data-testid="progress-severity"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Healthy</span>
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Badge className={getSeverityColor(result.severity)} data-testid="badge-severity">
              {getSeverityLabel(result.severity)}
            </Badge>
            <span className="text-muted-foreground">• Immediate action recommended</span>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organic Treatment */}
        <Card>
          <div className="bg-success/10 border-b border-border p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Leaf className="text-success text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Organic Treatment</h3>
                <p className="text-sm text-muted-foreground">Natural & eco-friendly solutions</p>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              {result.organic_diagnosis.split('.').filter(item => item.trim()).map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-foreground" data-testid={`text-organic-${index}`}>
                    {item.trim()}.
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-info/10 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="text-info h-4 w-4" />
                <span className="text-sm font-medium">Timeline: 7-14 days for improvement</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chemical Treatment */}
        <Card>
          <div className="bg-accent/10 border-b border-border p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <FlaskConical className="text-accent text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Chemical Treatment</h3>
                <p className="text-sm text-muted-foreground">Fast-acting conventional solutions</p>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              {result.chemical_diagnosis.split('.').filter(item => item.trim()).map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-foreground" data-testid={`text-chemical-${index}`}>
                    {item.trim()}.
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-warning/10 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-warning h-4 w-4" />
                <span className="text-sm font-medium">Always follow safety protocols and local regulations</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Prevention Tips */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center">
              <Shield className="text-info" />
            </div>
            <h3 className="font-semibold text-foreground">Prevention Tips</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start space-x-2">
              <span className="text-success">•</span>
              <span>Water at soil level to avoid leaf wetness</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-success">•</span>
              <span>Provide adequate plant spacing</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-success">•</span>
              <span>Monitor humidity levels regularly</span>
            </li>
          </ul>
        </Card>

        {/* Weather Impact */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
              <CloudRain className="text-warning" />
            </div>
            <h3 className="font-semibold text-foreground">Weather Factors</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Humidity Risk:</span>
              <span className="font-medium text-warning">High</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature:</span>
              <span className="font-medium text-foreground">Optimal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rain Forecast:</span>
              <span className="font-medium text-info">Moderate</span>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Next Steps</h3>
          </div>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              size="sm"
              data-testid="button-schedule-followup"
            >
              <Calendar className="mr-3 h-4 w-4" />
              Schedule Follow-up
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              size="sm"
              data-testid="button-share-results"
            >
              <Share className="mr-3 h-4 w-4" />
              Share Results
            </Button>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto pt-6">
        <Button 
          onClick={onNewScan} 
          className="flex-1"
          data-testid="button-new-scan"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Scan
        </Button>
        <Button 
          variant="secondary" 
          className="flex-1"
          data-testid="button-export-report"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Quick Stats Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Activity</h3>
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold bg-muted animate-pulse rounded h-8 w-8 mx-auto mb-2"></div>
                <div className="bg-muted animate-pulse rounded h-4 w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="stat-scans-today">
                {userStats?.scansToday || 0}
              </div>
              <div className="text-sm text-muted-foreground">Scans Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success" data-testid="stat-healthy-plants">
                {userStats?.healthyPlants || 0}
              </div>
              <div className="text-sm text-muted-foreground">Healthy Plants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning" data-testid="stat-need-treatment">
                {userStats?.needTreatment || 0}
              </div>
              <div className="text-sm text-muted-foreground">Need Treatment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive" data-testid="stat-critical-cases">
                {userStats?.criticalCases || 0}
              </div>
              <div className="text-sm text-muted-foreground">Critical Cases</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
