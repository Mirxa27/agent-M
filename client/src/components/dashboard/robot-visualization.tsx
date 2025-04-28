import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface RobotVisualizationProps {
  message?: string;
  subMessage?: string;
  onCustomize?: () => void;
}

export default function RobotVisualization({ 
  message = "How can I help you today?", 
  subMessage = "I'm powered by advanced AI to automate your tasks",
  onCustomize
}: RobotVisualizationProps) {
  const robotRef = useRef<HTMLDivElement>(null);

  // Add floating animation effect
  useEffect(() => {
    const robot = robotRef.current;
    if (!robot) return;

    let startTime: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Simple floating animation
      const translateY = Math.sin(elapsed / 1000) * 5;
      const rotateY = Math.sin(elapsed / 2000) * 5;
      
      robot.style.transform = `translateY(${translateY}px) rotateY(${rotateY}deg)`;
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    let animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-medium mb-4">Mirxa Assistant</h3>
      
      <div className="robot-container flex justify-center mb-4 perspective-800">
        <div ref={robotRef} className="robot w-40 h-40 bg-primary-50 rounded-full flex items-center justify-center">
          {/* Simple 3D-like Robot Visualization */}
          <div className="relative w-24 h-28">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-primary-400 rounded-xl flex items-center justify-center shadow-md">
              <div className="w-10 h-3 bg-primary-200 rounded-md"></div>
              <div className="absolute top-4 left-3 w-3 h-3 bg-primary-100 rounded-full"></div>
              <div className="absolute top-4 right-3 w-3 h-3 bg-primary-100 rounded-full"></div>
            </div>
            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-primary-300 rounded-lg shadow-md"></div>
            <div className="absolute top-22 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-primary-500 rounded-md shadow-md"></div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="font-medium">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{subMessage}</p>
      </div>
      
      {onCustomize && (
        <div className="mt-4">
          <Button
            onClick={onCustomize}
            variant="outline"
            className="w-full bg-primary-50 hover:bg-primary-100 text-primary-600 font-medium py-2 rounded-lg text-sm transition duration-150"
          >
            Customize Assistant
          </Button>
        </div>
      )}
    </div>
  );
}
