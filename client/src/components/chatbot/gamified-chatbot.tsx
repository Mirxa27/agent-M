import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { 
  Bot,
  User,
  ThumbsUp,
  Award,
  X,
  MinimizeIcon,
  MaximizeIcon,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

// Badge definitions with their meanings and icons
type BadgeKey = 'explorer' | 'communicator' | 'problemSolver' | 'credentialMaster' | 'automator' | 'teamPlayer';

type BadgeInfo = {
  label: string;
  description: string;
};

const badgeDefinitions: Record<BadgeKey, BadgeInfo> = {
  explorer: { label: "Explorer", description: "Discovered 5 features of the platform" },
  communicator: { label: "Communicator", description: "Had 10 consecutive chats with the assistant" },
  problemSolver: { label: "Problem Solver", description: "Successfully completed 3 tasks" },
  credentialMaster: { label: "Credential Master", description: "Added credentials for 3 different services" },
  automator: { label: "Automator", description: "Created your first automation workflow" },
  teamPlayer: { label: "Team Player", description: "Shared a template with another user" },
};

type Message = {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: string;
};

type GameInfo = {
  level: number;
  points: number;
  badges: Array<BadgeKey | string>;  // Can be either a BadgeKey or other string 
  streak: number;
  avatarChoice: string;
  completedChallenges: string[];
};

export const GamifiedChatbot = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gameInfo, setGameInfo] = useState<GameInfo>({
    level: 1,
    points: 0,
    badges: [],
    streak: 0,
    avatarChoice: "default",
    completedChallenges: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate points needed for next level
  const pointsForNextLevel = (gameInfo.level) * 100;
  const progressToNextLevel = Math.min(100, (gameInfo.points % 100) / (pointsForNextLevel / 100) * 100);

  // Initialize session and fetch any existing data
  useEffect(() => {
    // Generate a random session ID if not present
    if (!sessionId) {
      const newSessionId = Math.random().toString(36).substring(2, 15);
      setSessionId(newSessionId);
      
      // Add welcome message
      setMessages([
        {
          id: "welcome",
          content: "Hi there! I'm your helpful assistant. Ask me anything about our platform, AI agents, or how to get started!",
          isBot: true,
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Fetch game progress
      fetchGameProgress(newSessionId);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchGameProgress = async (sid: string) => {
    try {
      const response = await apiRequest("GET", `/api/chatbot/game-progress?sessionId=${sid}`);
      const data = await response.json();
      setGameInfo(data);
    } catch (error) {
      console.error("Failed to fetch game progress:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/chatbot/message", {
        content: input,
        sessionId: sessionId
      });
      
      const data = await response.json();
      
      // Add bot response
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now().toString(),
          content: data.content,
          isBot: true,
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Update game info
      setGameInfo(data.gameInfo);
      
      // Show toast if user leveled up
      if (data.gameInfo.level > gameInfo.level) {
        toast({
          title: "Level up!",
          description: `Congratulations! You've reached level ${data.gameInfo.level}!`,
          variant: "default",
        });
      }
      
      // Show toast if user earned new badges
      const newBadges = data.gameInfo.badges.filter(
        (badge) => !gameInfo.badges.includes(badge)
      );
      
      if (newBadges.length > 0) {
        toast({
          title: "New badge earned!",
          description: `You've earned the ${newBadges.map(badge => {
            const badgeInfo = getBadgeInfo(badge);
            return badgeInfo.label;
          }).join(", ")} badge!`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          isBot: true,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle chatbot open/closed
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  // Toggle minimized state
  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  // Helper function to safely get badge data
  const getBadgeInfo = (badge: string): { label: string, description: string } => {
    // Check if the badge is a valid key in our definitions
    const validBadgeKeys = Object.keys(badgeDefinitions) as Array<BadgeKey>;
    if (validBadgeKeys.includes(badge as BadgeKey)) {
      return badgeDefinitions[badge as BadgeKey];
    }
    // Return a fallback for custom/unknown badges
    return { 
      label: badge,
      description: `Custom badge: ${badge}`
    };
  };

  const renderBadges = () => {
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {gameInfo.badges.length > 0 ? (
          gameInfo.badges.map((badge, index) => {
            const badgeInfo = getBadgeInfo(badge);
            
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      <Award className="w-3 h-3 mr-1" />
                      {badgeInfo.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{badgeInfo.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })
        ) : (
          <span className="text-xs text-muted-foreground">Complete challenges to earn badges!</span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating chat button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={toggleChatbot}
              size="icon"
              className="h-12 w-12 rounded-full bg-primary shadow-lg hover:bg-primary/90"
            >
              <Bot className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="w-80 sm:w-96 shadow-lg border-primary/20">
              <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Mirxa Assistant</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={toggleMinimize}
                  >
                    {isMinimized ? <MaximizeIcon className="h-4 w-4" /> : <MinimizeIcon className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={toggleChatbot}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {/* Game progress info */}
                    <div className="px-3 py-2 bg-muted/30 border-b flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium">Level {gameInfo.level}</span>
                          <span className="text-xs text-muted-foreground">({gameInfo.points} points)</span>
                        </div>
                        <Progress value={progressToNextLevel} className="h-1 mt-1" />
                      </div>
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center space-x-1 text-amber-500">
                                <ThumbsUp className="h-3 w-3" />
                                <span className="text-xs font-medium">{gameInfo.streak} day streak</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Come back daily to increase your streak!</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Chat messages */}
                    <CardContent className="p-3 max-h-96 overflow-y-auto card-glass bg-opacity-60">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.isBot ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`rounded-lg px-3 py-2 max-w-[80%] ${
                                message.isBot
                                  ? "bg-muted/70 text-foreground text-shadow-sm"
                                  : "bg-primary/80 text-primary-foreground text-shadow-sm"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {message.isBot && (
                                  <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                                )}
                                <p className="text-sm">{message.content}</p>
                                {!message.isBot && (
                                  <User className="h-4 w-4 mt-1 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-muted/70 rounded-lg px-4 py-2 max-w-[80%]">
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </CardContent>

                    {/* Badges */}
                    {gameInfo.badges.length > 0 && (
                      <div className="px-3 py-2 border-t">
                        <p className="text-xs font-medium mb-1">Your badges:</p>
                        {renderBadges()}
                      </div>
                    )}

                    {/* Input */}
                    <CardFooter className="p-3 border-t">
                      <form 
                        className="flex w-full space-x-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                      >
                        <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyPress}
                          disabled={isLoading}
                          placeholder="Type your message..."
                          className="flex-1"
                        />
                        <Button 
                          size="icon"
                          type="submit"
                          disabled={isLoading || !input.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </CardFooter>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};