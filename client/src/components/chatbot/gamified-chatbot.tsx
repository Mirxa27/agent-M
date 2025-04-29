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
  Send,
  Trophy,
  Sparkles,
  Flame
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
    // Define badge colors based on name
    const getBadgeColor = (badge: string): string => {
      const badgeMap: Record<string, string> = {
        explorer: 'from-blue-600/70 to-blue-800/70 border-blue-500/30',
        communicator: 'from-green-600/70 to-green-800/70 border-green-500/30',
        problemSolver: 'from-amber-600/70 to-amber-800/70 border-amber-500/30',
        credentialMaster: 'from-purple-600/70 to-purple-800/70 border-purple-500/30',
        automator: 'from-red-600/70 to-red-800/70 border-red-500/30',
        teamPlayer: 'from-teal-600/70 to-teal-800/70 border-teal-500/30',
      };
      
      return badgeMap[badge] || 'from-gray-600/70 to-gray-800/70 border-gray-500/30';
    };

    return (
      <div className="flex flex-wrap gap-2">
        {gameInfo.badges.length > 0 ? (
          gameInfo.badges.map((badge, index) => {
            const badgeInfo = getBadgeInfo(badge);
            const badgeColor = getBadgeColor(badge);
            
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className={`bg-gradient-to-r ${badgeColor} text-white px-3 py-1 shadow-md border-1 hover:scale-105 transition-transform`}
                    >
                      <Award className="w-3 h-3 mr-2" />
                      {badgeInfo.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/80 border-primary/30">
                    <p className="text-xs">{badgeInfo.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })
        ) : (
          <div className="text-xs text-gray-400 italic flex items-center justify-center w-full py-2">
            <Award className="w-3.5 h-3.5 mr-2 opacity-50" />
            Complete challenges to earn badges!
          </div>
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
            className="fixed bottom-20 right-6 z-50 touch-manipulation"
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
            className="fixed bottom-20 sm:bottom-20 right-0 sm:right-6 z-50 w-full sm:w-auto"
          >
            <Card className="w-full sm:w-96 shadow-xl border-primary/20 max-h-[90vh] sm:max-h-[600px] flex flex-col rounded-lg overflow-hidden">
              <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-primary/80 to-purple-600/80 backdrop-blur-sm shadow-md">
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 p-1.5 rounded-full shadow-inner">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base text-white font-bold">Mirxa Assistant</CardTitle>
                    <span className="text-xs text-white/70">AI-powered helper</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-80 hover:opacity-100 hover:bg-white/10 text-white transition-all rounded-full" 
                    onClick={toggleMinimize}
                    aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                  >
                    {isMinimized ? <MaximizeIcon className="h-4 w-4" /> : <MinimizeIcon className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-80 hover:opacity-100 hover:bg-white/10 text-white transition-all rounded-full" 
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
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-900/90 to-gray-800/90 border-b border-gray-700/30 flex items-center justify-between">
                      <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/20 p-1 rounded-md">
                              <Trophy className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-xs font-bold text-white">Level {gameInfo.level}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-xs text-primary font-medium">{gameInfo.points} XP</span>
                          </div>
                        </div>
                        <Progress value={progressToNextLevel} className="h-1.5 mt-1 rounded-full bg-gray-700/50" 
                          style={{
                            background: 'linear-gradient(90deg, rgba(30,30,30,0.5) 0%, rgba(50,50,50,0.5) 100%)',
                          }}
                        />
                        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                          <span>Progress</span>
                          <span>{Math.floor(progressToNextLevel)}% to Level {gameInfo.level + 1}</span>
                        </div>
                      </div>
                      <div className="flex items-center ml-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex flex-col items-center justify-center bg-amber-500/10 p-2 rounded-md">
                                <Flame className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-bold text-amber-500">{gameInfo.streak}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/80 border-amber-500/30">
                              <p className="text-xs">🔥 {gameInfo.streak} day streak! Return daily to earn bonus rewards.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Chat messages */}
                    <CardContent 
                      className="p-4 overflow-y-auto bg-gradient-to-b from-gray-900/90 to-gray-950/90 flex-grow" 
                      style={{ 
                        height: "calc(50vh - 120px)", 
                        minHeight: "180px",
                        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(50, 50, 100, 0.05) 0%, rgba(0, 0, 0, 0) 70%)"
                      }}
                    >
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
                            {message.isBot ? (
                              <div className="flex items-start gap-2 max-w-[90%]">
                                <div className="flex-shrink-0 mt-1 bg-primary/20 rounded-full p-1">
                                  <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <div className="rounded-2xl rounded-tl-none px-4 py-2 shadow-md bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/30 text-white">
                                  <p className="text-sm break-words leading-relaxed">{message.content}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2 max-w-[90%]">
                                <div className="rounded-2xl rounded-tr-none px-4 py-2 shadow-md bg-gradient-to-br from-primary/80 to-indigo-700/90 text-white border border-primary/30">
                                  <p className="text-sm break-words leading-relaxed">{message.content}</p>
                                </div>
                                <div className="flex-shrink-0 mt-1 bg-primary/20 rounded-full p-1">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {isLoading && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-start"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-1 bg-primary/20 rounded-full p-1">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                              <div className="rounded-2xl rounded-tl-none px-4 py-3 shadow-md bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/30">
                                <div className="flex space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </CardContent>

                    {/* Badges */}
                    {gameInfo.badges.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-700/30 bg-gradient-to-r from-gray-800/90 to-gray-900/90">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-white flex items-center">
                            <Award className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                            Your Achievements
                          </p>
                          <span className="text-xs text-primary px-2 py-0.5 bg-primary/10 rounded-full font-medium">
                            {gameInfo.badges.length} earned
                          </span>
                        </div>
                        {renderBadges()}
                      </div>
                    )}

                    {/* Input */}
                    <CardFooter className="p-4 border-t border-gray-800/50 bg-gradient-to-r from-gray-900/90 to-gray-800/90 mt-auto">
                      <form 
                        className="flex w-full space-x-2 relative"
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                      >
                        <div className="relative flex-1 overflow-hidden">
                          <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-black/40 pr-12 border-gray-700/50 placeholder:text-gray-400 text-white focus-visible:ring-primary rounded-full pl-4 py-5 shadow-inner"
                          />
                          <Button 
                            size="icon"
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 shadow-md transition-all active:translate-y-[1px] h-8 w-8 rounded-full"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </form>
                      
                      {/* Quick suggestions */}
                      {messages.length <= 2 && !isLoading && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-gray-800/30 border-gray-700/50 text-gray-200 text-xs hover:bg-gray-700/50 rounded-full"
                            onClick={() => {
                              setInput("What can you help me with?");
                              setTimeout(() => sendMessage(), 100);
                            }}
                          >
                            What can you help me with?
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-gray-800/30 border-gray-700/50 text-gray-200 text-xs hover:bg-gray-700/50 rounded-full"
                            onClick={() => {
                              setInput("How do I earn badges?");
                              setTimeout(() => sendMessage(), 100);
                            }}
                          >
                            How do I earn badges?
                          </Button>
                        </div>
                      )}
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