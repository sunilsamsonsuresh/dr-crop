import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Leaf, 
  Search, 
  ClipboardList, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  Zap,
  Camera,
  Brain,
  BarChart3,
  Globe
} from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <Leaf className="text-primary-foreground text-xl" />
              </div>
              <h1 className="text-xl font-bold">Dr Crop</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="hover:text-primary-foreground/80 transition-colors">Home</Link>
              <Link href="#features" className="hover:text-primary-foreground/80 transition-colors">Features</Link>
              <Link href="#how-it-works" className="hover:text-primary-foreground/80 transition-colors">How It Works</Link>
              <Link href="#pricing" className="hover:text-primary-foreground/80 transition-colors">Pricing</Link>
              <Link href="#contact" className="hover:text-primary-foreground/80 transition-colors">Contact</Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Revolutionize Plant Farming with{" "}
              <span className="text-primary">AI-Powered Disease Detection</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Advanced application designed to revolutionize plant disease management for farmers. 
              Get instant, accurate disease identification and personalized treatment recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Hero Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose Dr Crop?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform provides comprehensive plant health monitoring and disease management solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI-Powered Disease Detection */}
            <Card className="bg-primary text-primary-foreground border-0 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI-Powered Disease Detection</h3>
                <p className="text-primary-foreground/90 leading-relaxed">
                  Early detection with 98% accuracy protects your harvest from devastating losses. 
                  Our advanced AI analyzes plant images in seconds.
                </p>
              </CardContent>
            </Card>

            {/* Personalized Treatment Recommendations */}
            <Card className="bg-background border border-border shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ClipboardList className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Personalized Treatment Recommendations</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get tailored treatment plans based on your specific plant condition. 
                  Both organic and chemical solutions with detailed application guidelines.
                </p>
              </CardContent>
            </Card>

            {/* Farmer Community Hub */}
            <Card className="bg-background border border-border shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Farmer Community Hub</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Interact with fellow farmers, share knowledge and solve challenges together. 
                  Build a network of agricultural experts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Simple 3-step process to get your plant health analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Upload Photo</h3>
              <p className="text-muted-foreground">
                Take a clear photo of your plant or upload an existing image. 
                Our system works with any device camera.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">AI Analysis</h3>
              <p className="text-muted-foreground">
                Our advanced AI examines the image for disease indicators, 
                analyzing patterns, colors, and symptoms in seconds.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Get Results</h3>
              <p className="text-muted-foreground">
                Receive detailed diagnosis, severity assessment, and personalized 
                treatment recommendations immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-primary-foreground/80">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">3s</div>
              <div className="text-primary-foreground/80">Analysis Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-primary-foreground/80">Diseases Detected</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-foreground/80">Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Protect Your Crops?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of farmers who trust Dr Crop for plant disease management. 
            Start your free trial today.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Leaf className="text-primary-foreground" size={16} />
                </div>
                <span className="font-bold text-foreground">Dr Crop</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Advanced plant disease diagnostics powered by AI technology for modern agriculture professionals.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Dr Crop. All rights reserved. Revolutionizing agriculture with AI technology.</p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              A product by <span className="font-semibold text-primary">SamStudios</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
