import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Trash2, 
  Calendar, 
  Leaf, 
  AlertTriangle,
  ArrowLeft,
  CheckSquare,
  Square
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Analysis } from "@shared/schema";
import { Link } from "wouter";

export default function Settings() {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['/api/analyses'],
    queryFn: async (): Promise<Analysis[]> => {
      const response = await apiRequest('GET', '/api/analyses');
      return response.json();
    },
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await apiRequest('DELETE', `/api/analyses/${analysisId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Deleted",
        description: "The scan has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the analysis",
        variant: "destructive",
      });
    },
  });

  const deleteAllAnalysesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/analyses');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "All Analyses Deleted",
        description: "All your scans have been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      setSelectedAnalyses([]);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete analyses",
        variant: "destructive",
      });
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async (analysisIds: string[]) => {
      await Promise.all(
        analysisIds.map(id => 
          apiRequest('DELETE', `/api/analyses/${id}`)
        )
      );
    },
    onSuccess: () => {
      toast({
        title: "Selected Analyses Deleted",
        description: `${selectedAnalyses.length} scan(s) deleted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      setSelectedAnalyses([]);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete selected analyses",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedAnalyses.length === analyses.length) {
      setSelectedAnalyses([]);
    } else {
      setSelectedAnalyses(analyses.map(a => a.id));
    }
  };

  const handleSelectAnalysis = (analysisId: string) => {
    setSelectedAnalyses(prev => 
      prev.includes(analysisId) 
        ? prev.filter(id => id !== analysisId)
        : [...prev, analysisId]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'none':
      case 'healthy':
        return 'bg-green-500';
      case 'low':
        return 'bg-yellow-500';
      case 'moderate':
      case 'medium':
        return 'bg-orange-500';
      case 'high':
      case 'severe':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  // Sort analyses by creation date (newest first)
  const sortedAnalyses = [...analyses].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Leaf className="text-primary-foreground text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Settings</h1>
                  <p className="text-sm text-muted-foreground">Manage your scans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Scan History</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {selectedAnalyses.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSelectedMutation.mutate(selectedAnalyses)}
                    disabled={deleteSelectedMutation.isPending}
                    data-testid="button-delete-selected"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedAnalyses.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  data-testid="button-select-all"
                >
                  {selectedAnalyses.length === analyses.length ? (
                    <CheckSquare className="h-4 w-4 mr-2" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  {selectedAnalyses.length === analyses.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteAllAnalysesMutation.mutate()}
                  disabled={deleteAllAnalysesMutation.isPending || analyses.length === 0}
                  data-testid="button-delete-all"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse rounded-lg h-24"></div>
                ))}
              </div>
            ) : sortedAnalyses.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Scans Yet</h3>
                <p className="text-muted-foreground">Upload your first plant image to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`analysis-item-${analysis.id}`}
                  >
                    <Checkbox
                      checked={selectedAnalyses.includes(analysis.id)}
                      onCheckedChange={() => handleSelectAnalysis(analysis.id)}
                      data-testid={`checkbox-${analysis.id}`}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {analysis.disease}
                        </h3>
                        <Badge 
                          variant="secondary" 
                          className={`${getSeverityColor(analysis.severity)} text-white`}
                        >
                          {analysis.severity} ({analysis.severityPercent}%)
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(analysis.createdAt)}</span>
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnalysisMutation.mutate(analysis.id)}
                      disabled={deleteAnalysisMutation.isPending}
                      data-testid={`button-delete-${analysis.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}