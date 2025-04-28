import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Loader2, Bot, Zap, ShieldCheck, FileText, User, CreditCard, PlugZap, Check } from "lucide-react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // If already logged in, redirect to dashboard
  if (user) {
    navigate("/dashboard");
    return null;
  }
  
  // Handle scroll events to change navbar appearance
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      setIsScrolled(window.scrollY > 10);
    });
  }
  
  // Features list for the platform
  const features = [
    {
      icon: <Bot className="h-10 w-10 text-primary" />,
      title: "AI Agents",
      description: "Create intelligent agents that can perform complex tasks automatically using multiple AI providers."
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: "Secure Credentials",
      description: "Store and manage API keys and credentials with end-to-end encryption for maximum security."
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Template Library",
      description: "Build a library of templates for your agents to use when performing tasks and generating content."
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Task Automation",
      description: "Schedule and automate repetitive tasks with detailed history and analytics."
    },
    {
      icon: <PlugZap className="h-10 w-10 text-primary" />,
      title: "Multiple AI Services",
      description: "Connect to OpenAI, Anthropic, Perplexity, xAI and other providers from a single interface."
    },
    {
      icon: <CreditCard className="h-10 w-10 text-primary" />,
      title: "Flexible Plans",
      description: "Choose from various subscription plans that fit your needs and budget with SAR pricing."
    }
  ];
  
  // Pricing plans
  const plans = [
    {
      name: "Free",
      price: "0",
      interval: "forever",
      features: ["2 AI Agents", "100 Tasks/month", "5 Templates", "1 GB Storage"],
      buttonText: "Get Started",
      popular: false
    },
    {
      name: "Professional",
      price: "199",
      interval: "per month",
      features: ["Unlimited Agents", "1,000 Tasks/month", "Unlimited Templates", "10 GB Storage", "API Access", "Priority Support"],
      buttonText: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "999",
      interval: "per month",
      features: ["Unlimited Everything", "Custom AI Models", "Dedicated Account Manager", "SSO Authentication", "Custom Branding", "24/7 Support"],
      buttonText: "Contact Sales",
      popular: false
    }
  ];
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${isScrolled ? "bg-white/80 backdrop-blur-md border-b shadow-sm" : "bg-transparent"}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-primary" />
                <span className="font-bold text-2xl bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                  Mirxa.io
                </span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Testimonials
              </Link>
            </nav>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => location.href = '/auth'}>Sign In</Button>
              <Button onClick={() => location.href = '/auth'}>
                <span>Get Started</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
                  <span className="bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                    Next-Generation
                  </span>
                  <br />
                  AI Agent Platform
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-lg">
                  Create, manage, and automate intelligent AI agents that perform complex tasks securely with your credentials and templates.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button size="lg" className="px-8" onClick={() => location.href = '/auth'}>
                    Get Started Free
                  </Button>
                  <Button size="lg" variant="outline" className="px-8">
                    Watch Demo
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 relative">
                <div className="w-full h-[400px] rounded-xl bg-gradient-to-br from-primary/20 to-primary-foreground/20 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bot className="h-32 w-32 text-primary/40" />
                  </div>
                  {/* We would add a 3D robot or platform image here */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Powerful AI Agent Capabilities</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Mirxa.io combines advanced AI with secure credential management and template systems to automate your workflows.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 p-3 rounded-full w-16 h-16 flex items-center justify-center bg-primary/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the plan that's right for you, with prices in Saudi Riyal (SAR).
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <div 
                  key={index} 
                  className={`
                    rounded-xl shadow-sm border relative overflow-hidden
                    ${plan.popular ? 'border-primary shadow-md ring-2 ring-primary scale-105 z-10' : 'border-gray-200'}
                  `}
                >
                  {plan.popular && (
                    <div className="absolute top-0 inset-x-0 bg-primary text-white text-xs font-semibold text-center py-1">
                      MOST POPULAR
                    </div>
                  )}
                  <div className={`p-8 ${plan.popular ? 'pt-10' : ''}`}>
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline mb-6">
                      <span className="text-4xl font-bold">{plan.price} SAR</span>
                      <span className="text-gray-600 ml-2">{plan.interval}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-3" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => location.href = '/auth'}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10 text-gray-500 text-sm">
              All prices are in Saudi Riyal (SAR). Subscription billed through MyFatoorah payment gateway.
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Hear from the businesses and individuals who've transformed their workflows with Mirxa.io.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Customer Name</h4>
                      <p className="text-sm text-gray-500">Company, Position</p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    "Mirxa.io has completely transformed how we handle our repetitive tasks. The AI agents are intelligent and the security features give us peace of mind."
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Workflow?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of users who are already automating their tasks with Mirxa.io's AI agents.
              </p>
              <Button size="lg" variant="secondary" className="px-8" onClick={() => location.href = '/auth'}>
                Get Started Free
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Bot className="h-8 w-8 text-primary" />
                <span className="font-bold text-2xl text-white">Mirxa.io</span>
              </div>
              <p className="mb-6">
                Next-generation AI agent platform with secure credential storage and task automation.
              </p>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Access</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} Mirxa.io. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}