import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Bot,
  Zap,
  ShieldCheck,
  FileText,
  User,
  CreditCard,
  PlugZap,
  Check,
  Menu,
  X,
  ChevronRight,
  Star,
  Calendar,
  BrainCircuit,
  MessageSquare,
  RocketIcon,
  SparklesIcon,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll events to change navbar appearance
  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);

      // Clean up event listener on component unmount
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Features list for the platform
  const features = [
    {
      icon: <Bot className="h-10 w-10 text-primary" />,
      title: "AI Agents",
      description:
        "Create intelligent agents that can perform complex tasks automatically using multiple AI providers.",
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: "Secure Credentials",
      description:
        "Store and manage API keys and credentials with end-to-end encryption for maximum security.",
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Template Library",
      description:
        "Build a library of templates for your agents to use when performing tasks and generating content.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Task Automation",
      description:
        "Schedule and automate repetitive tasks with detailed history and analytics.",
    },
    {
      icon: <PlugZap className="h-10 w-10 text-primary" />,
      title: "Multiple AI Services",
      description:
        "Connect to OpenAI, Anthropic, Perplexity, xAI and other providers from a single interface.",
    },
    {
      icon: <CreditCard className="h-10 w-10 text-primary" />,
      title: "Flexible Plans",
      description:
        "Choose from various subscription plans that fit your needs and budget with SAR pricing.",
    },
  ];

  // Pricing plans from database
  const { data: dbPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/plans"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/plans", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch plans");
        return await res.json();
      } catch (error) {
        // Silent fail - we'll use fallback plans
        return [];
      }
    },
    // Don't retry on error, use fallback plans instead
    retry: false,
  });

  // Fallback pricing plans if API call fails or is loading
  const fallbackPlans = [
    {
      name: "Free",
      price: "0",
      interval: "forever",
      features: [
        "2 AI Agents",
        "50 Tasks/month",
        "500 MB Storage",
        "3 Credentials",
      ],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Basic",
      price: "149",
      interval: "per month",
      features: [
        "5 AI Agents",
        "500 Tasks/month",
        "2 GB Storage",
        "10 Credentials",
        "Advanced Models",
        "Custom Prompts",
      ],
      buttonText: "Start Free Trial",
      popular: true,
    },
    {
      name: "Professional",
      price: "499",
      interval: "per month",
      features: [
        "20 AI Agents",
        "5000 Tasks/month",
        "5 GB Storage",
        "50 Credentials",
        "Advanced Models",
        "Custom Prompts",
        "Priority Support",
      ],
      buttonText: "Contact Sales",
      popular: false,
    },
  ];

  // Transform DB plans into displayable plans
  const transformDbPlansToDisplayable = (plans) => {
    if (!plans || plans.length === 0) return fallbackPlans;
    
    return plans
      .filter(plan => plan.isActive)
      .sort((a, b) => a.price - b.price)
      .map(plan => {
        // Set popularity: make the middle plan popular if there are 3+ plans
        const isMiddlePlan = plans.length >= 3 && 
          plans.indexOf(plan) === Math.floor(plans.length / 2) - (plans.length % 2 === 0 ? 1 : 0);
        
        // Extract features from plan.features object
        const featuresList = [];
        if (plan.features) {
          if (plan.features.agentLimit) featuresList.push(`${plan.features.agentLimit} AI Agents`);
          if (plan.features.taskLimit) featuresList.push(`${plan.features.taskLimit} Tasks/month`);
          if (plan.features.storageLimit) featuresList.push(`${plan.features.storageLimit} MB Storage`);
          if (plan.features.credentialLimit) featuresList.push(`${plan.features.credentialLimit} Credentials`);
          if (plan.features.advancedModels) featuresList.push("Advanced AI Models");
          if (plan.features.customPrompts) featuresList.push("Custom Prompts");
          if (plan.features.priority) featuresList.push("Priority Support");
        }
        
        return {
          name: plan.name,
          price: plan.price.toString(),
          interval: plan.interval === "monthly" ? "per month" : plan.interval === "yearly" ? "per year" : "forever",
          features: featuresList.length > 0 ? featuresList : ["Basic features"],
          buttonText: plan.price === 0 ? "Get Started" : 
                     isMiddlePlan ? "Start Free Trial" : "Subscribe Now",
          popular: isMiddlePlan,
        };
      });
  };

  // Use database plans if available, otherwise use fallback
  const plans = transformDbPlansToDisplayable(dbPlans);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? "card-glass border-b shadow-md backdrop-blur-md"
            : "bg-gray-800/80 backdrop-blur-sm"
        }`}
      >
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-primary" />
                <span className="font-bold text-2xl bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                  Mirxa.io
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-sm font-medium text-white/90 hover:text-primary text-shadow-sm transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-white/90 hover:text-primary text-shadow-sm transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-white/90 hover:text-primary text-shadow-sm transition-colors"
              >
                Testimonials
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-white/90 hover:text-primary text-shadow-sm transition-colors"
              >
                FAQ
              </Link>
            </nav>

            {/* Desktop CTA buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => (location.href = "/auth")}
                className="btn-glass text-sm font-medium px-4 py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => (location.href = "/auth")}
                className="btn-glass btn-glass-primary text-sm font-medium px-4 py-2 shadow-glow"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => {
                  console.log("Menu button clicked, current state:", mobileMenuOpen);
                  setMobileMenuOpen(true); // Force it open on every click for testing
                }}
                className="p-2 rounded-md btn-glass bg-primary shadow-glow flex items-center justify-center"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
                style={{ width: '45px', height: '45px' }}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-white" />
                ) : (
                  <Menu className="h-6 w-6 text-white font-bold" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu debug indicator */}
        {mobileMenuOpen && (
          <div className="fixed top-0 left-0 z-50 bg-green-500 text-white p-2 text-xs font-mono">
            Menu is OPEN
          </div>
        )}
        
        {/* Mobile menu */}
        <div
          ref={mobileMenuRef}
          className={cn(
            "md:hidden fixed inset-y-0 right-0 z-50 w-full sm:max-w-sm bg-black/95 backdrop-blur-lg border-l border-primary shadow-2xl transform transition-all duration-300 ease-in-out overflow-auto",
            mobileMenuOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none",
          )}
          style={{ top: "0px" }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-8 border-b border-white/20 pb-4">
              <Link href="/" className="flex items-center space-x-2">
                <Bot className="h-7 w-7 text-primary" />
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                  Mirxa.io
                </span>
              </Link>
              <button
                onClick={() => {
                  console.log("Close button clicked");
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded-md btn-glass bg-red-500"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <nav className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-primary text-shadow-sm font-semibold">
                  Menu
                </h3>
                <div className="space-y-2 pl-2">
                  <Link
                    href="#features"
                    className="flex items-center py-2 text-base font-medium text-white/90 hover:text-primary text-shadow-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#pricing"
                    className="flex items-center py-2 text-base font-medium text-white/90 hover:text-primary text-shadow-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="#testimonials"
                    className="flex items-center py-2 text-base font-medium text-white/90 hover:text-primary text-shadow-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Testimonials
                  </Link>
                  <Link
                    href="#faq"
                    className="flex items-center py-2 text-base font-medium text-white/90 hover:text-primary text-shadow-sm transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FAQ
                  </Link>
                </div>
              </div>

              <div className="pt-6 border-t border-white/20">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    location.href = "/auth";
                  }}
                  className="btn-glass btn-glass-primary w-full mb-3 py-3 shadow-glow"
                >
                  Get Started
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    location.href = "/auth";
                  }}
                  className="btn-glass w-full py-3"
                >
                  Sign In
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
                <div className="glass-text-container p-6 mb-6">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4 text-shadow-lg">
                    <span className="bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                      Next-Generation
                    </span>
                    <br />
                    <span className="text-high-contrast">AI Agent Platform</span>
                  </h1>
                  <p className="text-xl text-white/90 max-w-lg text-shadow-sm">
                    Create, manage, and automate intelligent AI agents that
                    perform complex tasks securely with your credentials and
                    templates.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    className="btn-glass btn-glass-primary px-8 py-3 font-medium shadow-glow bg-opacity-50"
                    onClick={() => (location.href = "/auth")}
                  >
                    Get Started Free
                  </button>
                  <button 
                    className="btn-glass px-8 py-3 font-medium bg-opacity-40"
                    onClick={() => alert("Demo Coming Soon!")}
                  >
                    Watch Demo
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 relative">
                <div className="w-full h-[400px] rounded-xl backdrop-blur-md bg-white/10 glass-container relative overflow-hidden shadow-glow">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bot className="h-32 w-32 text-primary/60" />
                  </div>
                  {/* We would add a 3D robot or platform image here */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="section-header-glass mx-auto mb-4">
                <h2 className="text-3xl font-bold text-high-contrast text-shadow-md">
                  Powerful AI Agent Capabilities
                </h2>
              </div>
              <div className="glass-text-container max-w-2xl mx-auto p-3 rounded-lg">
                <p className="text-lg text-white/90 text-shadow-sm">
                  Mirxa.io combines advanced AI with secure credential management
                  and template systems to automate your workflows.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="card-glass card-hover p-8 rounded-xl shadow-md border-white/10"
                >
                  <div className="mb-4 p-3 rounded-full w-16 h-16 flex items-center justify-center bg-primary/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-high-contrast text-shadow-sm">
                    {feature.title}
                  </h3>
                  <p className="text-white/90 text-shadow-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="section-header-glass mx-auto mb-4">
                <h2 className="text-3xl font-bold text-high-contrast text-shadow-md">
                  Simple, Transparent Pricing
                </h2>
              </div>
              <div className="glass-text-container max-w-2xl mx-auto p-3 rounded-lg">
                <p className="text-lg text-white/90 text-shadow-sm">
                  Choose the plan that's right for you, with prices in Saudi Riyal
                  (SAR).
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`
                    rounded-xl shadow-md relative overflow-hidden card-glass card-hover
                    ${plan.popular 
                      ? "border-primary shadow-lg ring-2 ring-primary scale-105 z-10 bg-opacity-70" 
                      : "border-gray-200/30 bg-opacity-60"
                    }
                  `}
                >
                  {plan.popular && (
                    <div className="absolute top-0 inset-x-0 bg-primary text-white text-xs font-semibold text-center py-1">
                      MOST POPULAR
                    </div>
                  )}
                  <div className={`p-8 ${plan.popular ? "pt-10" : ""}`}>
                    <h3 className="text-xl font-semibold mb-2 text-high-contrast text-shadow-sm">{plan.name}</h3>
                    <div className="flex items-baseline mb-6">
                      <span className="text-4xl font-bold text-high-contrast text-shadow-md">
                        {plan.price} SAR
                      </span>
                      <span className="text-white/80 ml-2 text-shadow-sm">
                        {plan.interval}
                      </span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-white/90 text-shadow-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`w-full py-3 ${plan.popular ? "btn-glass btn-glass-primary shadow-glow bg-opacity-50" : "btn-glass bg-opacity-40"}`}
                      onClick={() => (location.href = "/auth")}
                    >
                      {plan.buttonText}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass-text-container text-center mt-10 mx-auto p-2 rounded-lg max-w-lg">
              <p className="text-white/60 text-sm text-shadow-sm">
                All prices are in Saudi Riyal (SAR). Subscription billed through
                MyFatoorah payment gateway.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className="py-20"
        >
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="section-header-glass mx-auto mb-4">
                <h2 className="text-3xl font-bold text-high-contrast text-shadow-md">
                  What Our Customers Say
                </h2>
              </div>
              <div className="glass-text-container max-w-2xl mx-auto p-3 rounded-lg">
                <p className="text-lg text-white/90 text-shadow-sm">
                  Hear from the businesses and individuals who've transformed
                  their workflows with Mirxa.io.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="card-glass card-hover p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-high-contrast text-shadow-sm">Sarah Johnson</h4>
                    <p className="text-sm text-white/80 text-shadow-sm">
                      Marketing Director, TechVision
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                </div>
                <p className="text-white/90 text-shadow-sm">
                  "Mirxa.io has completely transformed how we handle our content
                  creation process. The AI agents are intelligent and the
                  security features give us peace of mind when handling
                  sensitive information."
                </p>
              </div>

              <div className="card-glass card-hover p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-high-contrast text-shadow-sm">Ahmed Al-Farsi</h4>
                    <p className="text-sm text-white/80 text-shadow-sm">
                      CTO, DataSphere
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                </div>
                <p className="text-white/90 text-shadow-sm">
                  "The secure credential management in Mirxa.io is a
                  game-changer for us. We can safely store API keys and automate
                  interactions with multiple services without compromising
                  security."
                </p>
              </div>

              <div className="card-glass card-hover p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-high-contrast text-shadow-sm">Mei Lin</h4>
                    <p className="text-sm text-white/80 text-shadow-sm">
                      Operations Manager, CloudWorks
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                </div>
                <p className="text-white/90 text-shadow-sm">
                  "We've reduced our workflow automation time by 75% using
                  Mirxa.io. The template system lets us create and deploy new
                  automations in minutes instead of days. Absolutely worth every
                  penny."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="section-header-glass mx-auto mb-4">
                <h2 className="text-3xl font-bold text-high-contrast text-shadow-md">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="glass-text-container max-w-2xl mx-auto p-3 rounded-lg">
                <p className="text-lg text-white/90 text-shadow-sm">
                  Find answers to common questions about Mirxa.io and our AI agent
                  platform.
                </p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="card-glass card-hover rounded-lg shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center text-high-contrast text-shadow-sm">
                    <span className="bg-primary/20 text-primary p-2 rounded-full mr-3">
                      <MessageSquare className="h-5 w-5" />
                    </span>
                    What is an AI agent platform?
                  </h3>
                  <p className="text-white/90 text-shadow-sm">
                    An AI agent platform is a system that allows you to create,
                    manage, and deploy intelligent software agents that can
                    perform tasks automatically. These agents use artificial
                    intelligence to make decisions, process information, and
                    execute actions based on predefined rules or learned
                    behaviors.
                  </p>
                </div>
              </div>

              <div className="card-glass card-hover rounded-lg shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center text-high-contrast text-shadow-sm">
                    <span className="bg-primary/20 text-primary p-2 rounded-full mr-3">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    How does Mirxa.io handle sensitive credentials?
                  </h3>
                  <p className="text-white/90 text-shadow-sm">
                    Mirxa.io uses end-to-end encryption to store all
                    credentials. Your API keys and sensitive information are
                    encrypted at rest and in transit. We follow industry best
                    practices for security, including regular security audits
                    and compliance with data protection regulations.
                  </p>
                </div>
              </div>

              <div className="card-glass card-hover rounded-lg shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center text-high-contrast text-shadow-sm">
                    <span className="bg-primary/20 text-primary p-2 rounded-full mr-3">
                      <Zap className="h-5 w-5" />
                    </span>
                    What types of tasks can I automate with Mirxa.io?
                  </h3>
                  <p className="text-white/90 text-shadow-sm">
                    You can automate a wide range of tasks including content
                    generation, data processing, social media management,
                    customer support, research, analytics, and more. Our
                    platform supports integration with popular AI services like
                    OpenAI, Anthropic, and custom APIs to extend functionality
                    based on your needs.
                  </p>
                </div>
              </div>

              <div className="card-glass card-hover rounded-lg shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center text-high-contrast text-shadow-sm">
                    <span className="bg-primary/20 text-primary p-2 rounded-full mr-3">
                      <Bot className="h-5 w-5" />
                    </span>
                    Do I need programming skills to use Mirxa.io?
                  </h3>
                  <p className="text-white/90 text-shadow-sm">
                    No, Mirxa.io is designed to be user-friendly for both
                    technical and non-technical users. You can create and deploy
                    AI agents using our intuitive interface without any coding
                    knowledge. However, for advanced customization, we do
                    provide options for developers to extend functionality.
                  </p>
                </div>
              </div>

              <div className="card-glass card-hover rounded-lg shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center text-high-contrast text-shadow-sm">
                    <span className="bg-primary/20 text-primary p-2 rounded-full mr-3">
                      <Calendar className="h-5 w-5" />
                    </span>
                    Can I schedule tasks to run automatically?
                  </h3>
                  <p className="text-white/90 text-shadow-sm">
                    Yes, Mirxa.io provides robust scheduling capabilities. You
                    can set up tasks to run at specific times, on regular
                    intervals, or in response to triggers like incoming data or
                    external events. Our platform also provides detailed
                    execution logs and analytics to monitor performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-white">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="section-header-glass mx-auto mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-high-contrast text-shadow-md">
                  Ready to Transform Your Workflow?
                </h2>
              </div>
              <div className="glass-text-container max-w-2xl mx-auto p-3 rounded-lg mb-8">
                <p className="text-xl text-white/90 text-shadow-sm">
                  Join thousands of users who are already automating their tasks
                  with Mirxa.io's AI agents.
                </p>
              </div>
              <button 
                className="btn-glass btn-glass-primary px-10 py-4 text-lg font-medium shadow-glow bg-opacity-50"
                onClick={() => (location.href = "/auth")}
              >
                Get Started Free
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-glass rounded-xl p-6 md:p-8 bg-opacity-60 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                  <span className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                    Mirxa.io
                  </span>
                </div>
                <p className="mb-6 text-sm sm:text-base text-white/90 text-shadow-sm">
                  Next-generation AI agent platform with secure credential storage
                  and task automation.
                </p>
                <div className="flex space-x-4 mb-6">
                  <a
                    href="#"
                    className="text-white/80 hover:text-primary transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                    <span className="sr-only">Twitter</span>
                  </a>
                  <a
                    href="#"
                    className="text-white/80 hover:text-primary transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                  <a
                    href="#"
                    className="text-white/80 hover:text-primary transition-colors"
                  >
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                  </a>
                </div>
              </div>

              <div className="mt-4 sm:mt-0">
                <h3 className="text-high-contrast text-base sm:text-lg font-semibold mb-4 text-shadow-sm">
                  Product
                </h3>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li>
                    <a
                      onClick={() =>
                        document.getElementById("features")?.scrollIntoView()
                      }
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        document.getElementById("pricing")?.scrollIntoView()
                      }
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        document.getElementById("faq")?.scrollIntoView()
                      }
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      API Access
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Enterprise
                    </a>
                  </li>
                </ul>
              </div>

              <div className="mt-4 sm:mt-0">
                <h3 className="text-high-contrast text-base sm:text-lg font-semibold mb-4 text-shadow-sm">
                  Company
                </h3>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      About Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Careers
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              <div className="mt-4 sm:mt-0">
                <h3 className="text-high-contrast text-base sm:text-lg font-semibold mb-4 text-shadow-sm">
                  Resources
                </h3>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Support Center
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="inline-block text-white/80 hover:text-primary transition-colors cursor-pointer text-shadow-sm"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-white/80 text-shadow-sm">
                © {new Date().getFullYear()} Mirxa.io. All rights reserved.
              </p>
              <div className="mt-4 sm:mt-0">
                <select
                  className="btn-glass text-white/90 text-sm rounded-md px-4 py-2 border-0 focus:outline-none focus:ring-1 focus:ring-primary"
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
