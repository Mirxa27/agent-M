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
      const data = await apiRequest<GameInfo>("GET", `/api/chatbot/game-progress?sessionId=${sid}`);
      setGameInfo(data);
    } catch (error) {
      console.error("Failed to fetch game progress:", error instanceof Error ? error.message : String(error));
      // Use default game info if there's an error
      toast({
        title: "Game Progress Error",
        description: "There was an issue loading your game progress. Starting with default values.",
        variant: "destructive",
      });
    }
  };

  // Define the expected response type from the chatbot message API
  type ChatbotMessageResponse = {
    content: string;
    gameInfo: GameInfo;
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
      const data = await apiRequest<ChatbotMessageResponse>("POST", "/api/chatbot/message", {
        content: input,
        sessionId: sessionId
      });
      
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
        (badge: string) => !gameInfo.badges.includes(badge)
      );
      
      if (newBadges.length > 0) {
        toast({
          title: "New badge earned!",
          description: `You've earned the ${newBadges.map((badge: string) => {
            const badgeInfo = getBadgeInfo(badge);
            return badgeInfo.label;
          }).join(", ")} badge!`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error instanceof Error ? error.message : String(error));
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 15 
            }}
            className="fixed bottom-6 right-6 z-50 touch-manipulation"
          >
            <Button
              onClick={toggleChatbot}
              size="icon"
              className="h-14 w-14 sm:h-12 sm:w-12 rounded-full bg-primary shadow-glow hover:bg-primary/90 transition-all border border-primary-foreground/20 active:translate-y-1"
              aria-label="Open chat assistant"
            >
              <Bot className="h-7 w-7 sm:h-6 sm:w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="fixed bottom-0 sm:bottom-6 right-0 sm:right-6 z-50 w-full sm:w-auto"
          >
            <Card className="w-full sm:w-96 shadow-xl border-primary/20 max-h-[90vh] sm:max-h-[600px] flex flex-col">
              <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base text-white text-shadow-sm">Mirxa Assistant</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-80 hover:opacity-100 hover:bg-black/20 transition-all" 
                    onClick={toggleMinimize}
                    aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                  >
                    {isMinimized ? <MaximizeIcon className="h-4 w-4" /> : <MinimizeIcon className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-80 hover:opacity-100 hover:bg-black/20 transition-all" 
                    onClick={toggleChatbot}
                    aria-label="Close chat"
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
                    <CardContent className="p-3 overflow-y-auto card-glass bg-opacity-60 flex-grow" style={{ height: "calc(50vh - 120px)", minHeight: "180px" }}>
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                              delay: index * 0.05, 
                              duration: 0.3,
                              type: "spring",
                              damping: 15 
                            }}
                            className={`flex ${
                              message.isBot ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`rounded-lg px-3 py-2 max-w-[85%] shadow-md ${
                                message.isBot
                                  ? "bg-black/40 backdrop-blur-sm text-white text-shadow-sm border border-gray-800/50"
                                  : "bg-primary/80 text-primary-foreground text-shadow-sm border border-primary/30"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {message.isBot && (
                                  <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                                )}
                                <p className="text-sm break-words">{message.content}</p>
                                {!message.isBot && (
                                  <User className="h-4 w-4 mt-1 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {isLoading && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-start"
                          >
                            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 max-w-[85%] shadow-md border border-gray-800/50">
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </CardContent>

                    {/* Badges */}
                    {gameInfo.badges.length > 0 && (
                      <div className="px-3 py-2 border-t border-gray-800/50 bg-black/30 backdrop-blur-sm">
                        <p className="text-xs font-medium mb-1 text-white text-shadow-sm">Your badges:</p>
                        {renderBadges()}
                      </div>
                    )}

                    {/* Input */}
                    <CardFooter className="p-3 border-t border-gray-800/50 bg-black/30 backdrop-blur-sm mt-auto">
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
                          className="flex-1 bg-black/50 border-gray-700 placeholder:text-gray-400 text-white focus-visible:ring-primary"
                        />
                        <Button 
                          size="icon"
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          className="bg-primary hover:bg-primary/90 shadow-md transition-all active:translate-y-0.5"
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