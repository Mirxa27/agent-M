import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  iconBgColor: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  changeText?: string;
  progressBar?: {
    value: number;
    max: number;
    color: string;
  };
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  change, 
  changeText,
  progressBar 
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      
      {progressBar ? (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`${progressBar.color} h-2 rounded-full`} 
              style={{ width: `${(progressBar.value / progressBar.max) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {Math.round((progressBar.value / progressBar.max) * 100)}% of your storage used
          </p>
        </div>
      ) : change ? (
        <div className="mt-4 flex items-center text-sm">
          <span className={`${change.isPositive ? 'text-green-500' : 'text-red-500'} font-medium flex items-center`}>
            <span className="inline-block mr-1">
              {change.isPositive ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              )}
            </span>
            {change.value}
          </span>
          {changeText && <span className="text-gray-400 ml-2">{changeText}</span>}
        </div>
      ) : (
        <div className="mt-4">
          <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded-md text-xs font-medium">
            {changeText || "Available now"}
          </span>
        </div>
      )}
    </div>
  );
}
