import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, Redirect } from "wouter";
import { Bot, Lock, FileText, Terminal, Star, Zap, Clock, Settings, Shield, CreditCard } from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  const features = [
    {
      icon: <Bot className="h-6 w-6 text-primary" />,
      title: "AI Agents",
      description: "Create and customize AI agents to automate various tasks across different platforms."
    },
    {
      icon: <Lock className="h-6 w-6 text-primary" />,
      title: "Secure Credentials",
      description: "Store your passwords and API keys with end-to-end encryption for maximum security."
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Templates",
      description: "Create reusable templates that your AI agents can use for consistent outputs."
    },
    {
      icon: <Terminal className="h-6 w-6 text-primary" />,
      title: "Multiple AI Providers",
      description: "Connect to OpenAI, Anthropic, and other AI providers through a unified interface."
    },
    {
      icon: <Star className="h-6 w-6 text-primary" />,
      title: "Task Automation",
      description: "Automate repetitive tasks with natural language instructions and scheduled execution."
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Advanced Integration",
      description: "Seamlessly integrate with email, WordPress, Google Workspace, and more platforms."
    }
  ];

  const benefits = [
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      title: "Save Time",
      description: "Automate repetitive tasks and free up hours of your day for more important work."
    },
    {
      icon: <Settings className="h-6 w-6 text-white" />,
      title: "Increase Efficiency",
      description: "Streamline workflows and processes with intelligent AI assistants."
    },
    {
      icon: <Shield className="h-6 w-6 text-white" />,
      title: "Enhanced Security",
      description: "Keep your credentials and data secure with our end-to-end encryption."
    },
    {
      icon: <CreditCard className="h-6 w-6 text-white" />,
      title: "Cost Effective",
      description: "Pay only for what you use with our flexible subscription plans."
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "0 SAR",
      description: "For individuals just getting started",
      features: [
        "2 AI Agents",
        "10 Tasks/month",
        "Basic templates",
        "Community support"
      ],
      isPopular: false,
      buttonText: "Get Started"
    },
    {
      name: "Professional",
      price: "99 SAR",
      period: "/month",
      description: "For professionals and small teams",
      features: [
        "10 AI Agents",
        "100 Tasks/month",
        "Advanced templates",
        "Priority support",
        "Custom AI configurations"
      ],
      isPopular: true,
      buttonText: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: "299 SAR",
      period: "/month",
      description: "For businesses with advanced needs",
      features: [
        "Unlimited AI Agents",
        "Unlimited tasks",
        "Custom template library",
        "Dedicated support",
        "Advanced integrations",
        "Team management"
      ],
      isPopular: false,
      buttonText: "Contact Sales"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center mr-2">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-heading font-bold">Mirxa.io</span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-primary">Features</a>
            <a href="#benefits" className="text-gray-600 hover:text-primary">Benefits</a>
            <a href="#pricing" className="text-gray-600 hover:text-primary">Pricing</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
                Your Next-Generation AI Agent Platform
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Create, manage, and automate tasks with AI agents while keeping your credentials secure.
                The ultimate platform for productivity and AI-powered automation.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/auth?tab=register">
                  <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-700 w-full sm:w-auto">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-primary-500 p-6 rounded-lg shadow-xl">
                <div className="robot-container perspective-800">
                  <div className="robot w-64 h-64 mx-auto bg-primary-400 rounded-full flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-primary-300 rounded-xl flex items-center justify-center shadow-md">
                        <div className="w-16 h-4 bg-primary-200 rounded-md"></div>
                        <div className="absolute top-6 left-4 w-4 h-4 bg-primary-100 rounded-full"></div>
                        <div className="absolute top-6 right-4 w-4 h-4 bg-primary-100 rounded-full"></div>
                      </div>
                      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-primary-300 rounded-lg shadow-md"></div>
                      <div className="absolute top-34 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-primary-500 rounded-md shadow-md"></div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-6 text-white">
                  <p className="font-medium">Mirxa AI Assistant</p>
                  <p className="text-sm text-primary-100 mt-1">Powered by advanced artificial intelligence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mirxa.io combines powerful AI capabilities with security and ease of use to deliver a comprehensive automation platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section id="benefits" className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Why Choose Mirxa.io</h2>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Our platform helps you achieve more with less effort, saving time and resources while enhancing your capabilities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-primary-700 p-6 rounded-xl border border-primary-500">
                <div className="w-12 h-12 bg-primary-800 rounded-lg flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">{benefit.title}</h3>
                <p className="text-primary-100">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with Mirxa.io is easy. Follow these simple steps to automate your tasks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-2xl">1</div>
              <h3 className="text-xl font-heading font-semibold mb-2">Create Your Agent</h3>
              <p className="text-gray-600">Define your AI agent's purpose and capabilities through our intuitive interface.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-2xl">2</div>
              <h3 className="text-xl font-heading font-semibold mb-2">Add Secure Credentials</h3>
              <p className="text-gray-600">Securely store your credentials and API keys with end-to-end encryption.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary font-bold text-2xl">3</div>
              <h3 className="text-xl font-heading font-semibold mb-2">Assign Tasks</h3>
              <p className="text-gray-600">Create tasks for your agents to execute, either on demand or on a schedule.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your needs. All plans include access to our core features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-sm overflow-hidden ${plan.isPopular ? 'ring-2 ring-primary' : ''}`}>
                {plan.isPopular && (
                  <div className="bg-primary text-white py-2 text-center text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-gray-500">{plan.period}</span>}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="h-5 w-5 text-primary mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.isPopular ? 'bg-primary hover:bg-primary-600' : ''}`}
                    variant={plan.isPopular ? 'default' : 'outline'}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Join thousands of users who are already saving time and increasing productivity with Mirxa.io
          </p>
          <Link href="/auth?tab=register">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <span className="text-xl font-heading font-bold text-white">Mirxa.io</span>
              </div>
              <p className="text-gray-400">
                Next-generation AI agent platform with secure credential storage, file management, and task automation.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">AI Agents</a></li>
                <li><a href="#" className="hover:text-white">Secure Credentials</a></li>
                <li><a href="#" className="hover:text-white">Templates</a></li>
                <li><a href="#" className="hover:text-white">Multiple AI Providers</a></li>
                <li><a href="#" className="hover:text-white">Task Automation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Support Center</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Legal</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Mirxa.io. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}