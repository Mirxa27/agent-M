import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
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

  // Pricing plans
  const plans = [
    {
      name: "Free",
      price: "0",
      interval: "forever",
      features: [
        "2 AI Agents",
        "100 Tasks/month",
        "5 Templates",
        "1 GB Storage",
      ],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Professional",
      price: "199",
      interval: "per month",
      features: [
        "Unlimited Agents",
        "1,000 Tasks/month",
        "Unlimited Templates",
        "10 GB Storage",
        "API Access",
        "Priority Support",
      ],
      buttonText: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "999",
      interval: "per month",
      features: [
        "Unlimited Everything",
        "Custom AI Models",
        "Dedicated Account Manager",
        "SSO Authentication",
        "Custom Branding",
        "24/7 Support",
      ],
      buttonText: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b shadow-sm"
            : "bg-transparent"
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
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Testimonials
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                FAQ
              </Link>
            </nav>

            {/* Desktop CTA buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => (location.href = "/auth")}
                className="text-sm font-medium"
              >
                Sign In
              </Button>
              <Button
                onClick={() => (location.href = "/auth")}
                className="text-sm"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          ref={mobileMenuRef}
          className={cn(
            "md:hidden fixed inset-y-0 right-0 z-50 w-full sm:max-w-sm bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out overflow-auto",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-8 border-b pb-4">
              <Link href="/" className="flex items-center space-x-2">
                <Bot className="h-7 w-7 text-primary" />
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                  Mirxa.io
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <nav className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                  Menu
                </h3>
                <div className="space-y-2 pl-2">
                  <Link
                    href="#features"
                    className="flex items-center py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#pricing"
                    className="flex items-center py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="#testimonials"
                    className="flex items-center py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Testimonials
                  </Link>
                  <Link
                    href="#faq"
                    className="flex items-center py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FAQ
                  </Link>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    location.href = "/auth";
                  }}
                  className="w-full mb-3"
                >
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    location.href = "/auth";
                  }}
                  className="w-full"
                >
                  Sign In
                </Button>
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
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
                  <span className="bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                    Next-Generation
                  </span>
                  <br />
                  AI Agent Platform
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-lg">
                  Create, manage, and automate intelligent AI agents that
                  perform complex tasks securely with your credentials and
                  templates.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button
                    size="lg"
                    className="px-8"
                    onClick={() => (location.href = "/auth")}
                  >
                    Get Started Free
                  </Button>
                  <Button size="lg" variant="outline" className="px-8">
                    Watch Demo
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 relative">
                <div className="w-full h-[400px] rounded-xl bg-gradient-to-br from-primary/20 to-primary-foreground/20 relative overflow-hidden shadow-lg">
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
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Powerful AI Agent Capabilities
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Mirxa.io combines advanced AI with secure credential management
                and template systems to automate your workflows.
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
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the plan that's right for you, with prices in Saudi Riyal
                (SAR).
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`
                    rounded-xl shadow-sm border relative overflow-hidden
                    ${plan.popular ? "border-primary shadow-md ring-2 ring-primary scale-105 z-10" : "border-gray-200"}
                  `}
                >
                  {plan.popular && (
                    <div className="absolute top-0 inset-x-0 bg-primary text-white text-xs font-semibold text-center py-1">
                      MOST POPULAR
                    </div>
                  )}
                  <div className={`p-8 ${plan.popular ? "pt-10" : ""}`}>
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline mb-6">
                      <span className="text-4xl font-bold">
                        {plan.price} SAR
                      </span>
                      <span className="text-gray-600 ml-2">
                        {plan.interval}
                      </span>
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
                      onClick={() => (location.href = "/auth")}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10 text-gray-500 text-sm">
              All prices are in Saudi Riyal (SAR). Subscription billed through
              MyFatoorah payment gateway.
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className="py-20 bg-gray-50 dark:bg-gray-900"
        >
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                What Our Customers Say
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Hear from the businesses and individuals who've transformed
                their workflows with Mirxa.io.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Sarah Johnson</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <p className="text-gray-600 dark:text-gray-300">
                  "Mirxa.io has completely transformed how we handle our content
                  creation process. The AI agents are intelligent and the
                  security features give us peace of mind when handling
                  sensitive information."
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Ahmed Al-Farsi</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <p className="text-gray-600 dark:text-gray-300">
                  "The secure credential management in Mirxa.io is a
                  game-changer for us. We can safely store API keys and automate
                  interactions with multiple services without compromising
                  security."
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Mei Lin</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <p className="text-gray-600 dark:text-gray-300">
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
              <h2 className="text-3xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Find answers to common questions about Mirxa.io and our AI agent
                platform.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="bg-primary/10 text-primary p-2 rounded-full mr-3">
                      <MessageSquare className="h-5 w-5" />
                    </span>
                    What is an AI agent platform?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    An AI agent platform is a system that allows you to create,
                    manage, and deploy intelligent software agents that can
                    perform tasks automatically. These agents use artificial
                    intelligence to make decisions, process information, and
                    execute actions based on predefined rules or learned
                    behaviors.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="bg-primary/10 text-primary p-2 rounded-full mr-3">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    How does Mirxa.io handle sensitive credentials?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Mirxa.io uses end-to-end encryption to store all
                    credentials. Your API keys and sensitive information are
                    encrypted at rest and in transit. We follow industry best
                    practices for security, including regular security audits
                    and compliance with data protection regulations.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="bg-primary/10 text-primary p-2 rounded-full mr-3">
                      <Zap className="h-5 w-5" />
                    </span>
                    What types of tasks can I automate with Mirxa.io?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    You can automate a wide range of tasks including content
                    generation, data processing, social media management,
                    customer support, research, analytics, and more. Our
                    platform supports integration with popular AI services like
                    OpenAI, Anthropic, and custom APIs to extend functionality
                    based on your needs.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="bg-primary/10 text-primary p-2 rounded-full mr-3">
                      <Bot className="h-5 w-5" />
                    </span>
                    Do I need programming skills to use Mirxa.io?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    No, Mirxa.io is designed to be user-friendly for both
                    technical and non-technical users. You can create and deploy
                    AI agents using our intuitive interface without any coding
                    knowledge. However, for advanced customization, we do
                    provide options for developers to extend functionality.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="bg-primary/10 text-primary p-2 rounded-full mr-3">
                      <Calendar className="h-5 w-5" />
                    </span>
                    Can I schedule tasks to run automatically?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
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
        <section className="py-20 bg-primary text-white">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Transform Your Workflow?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of users who are already automating their tasks
                with Mirxa.io's AI agents.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="px-8 py-6 text-lg"
                onClick={() => (location.href = "/auth")}
              >
                Get Started Free
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-12">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl sm:text-2xl text-white">
                  Mirxa.io
                </span>
              </div>
              <p className="mb-6 text-sm sm:text-base">
                Next-generation AI agent platform with secure credential storage
                and task automation.
              </p>
              <div className="flex space-x-4 mb-6">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
            </div>

            <div className="mt-4 sm:mt-0">
              <h3 className="text-white text-base sm:text-lg font-semibold mb-4">
                Product
              </h3>
              <ul className="space-y-2 text-sm sm:text-base">
                <li>
                  <a
                    onClick={() =>
                      document.getElementById("features")?.scrollIntoView()
                    }
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    onClick={() =>
                      document.getElementById("pricing")?.scrollIntoView()
                    }
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    onClick={() =>
                      document.getElementById("faq")?.scrollIntoView()
                    }
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    API Access
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Enterprise
                  </a>
                </li>
              </ul>
            </div>

            <div className="mt-4 sm:mt-0">
              <h3 className="text-white text-base sm:text-lg font-semibold mb-4">
                Company
              </h3>
              <ul className="space-y-2 text-sm sm:text-base">
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div className="mt-4 sm:mt-0">
              <h3 className="text-white text-base sm:text-lg font-semibold mb-4">
                Resources
              </h3>
              <ul className="space-y-2 text-sm sm:text-base">
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Support Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-block hover:text-white transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm">
              © {new Date().getFullYear()} Mirxa.io. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0">
              <select
                className="bg-gray-800 text-gray-300 text-sm rounded-md px-3 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
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
      </footer>
    </div>
  );
}
