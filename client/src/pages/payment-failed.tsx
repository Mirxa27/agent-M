import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";

export default function PaymentFailedPage() {
  const [, params] = useLocation();
  const [reason, setReason] = useState<string>("Unknown error");

  // Extract the reason from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlReason = searchParams.get("reason");

    if (urlReason) {
      setReason(formatReason(urlReason));
    }
  }, [params]);

  // Format error reason into more readable message
  const formatReason = (errorCode: string): string => {
    switch (errorCode) {
      case "no-payment-id":
        return "Payment session ID is missing";
      case "verification-failed":
        return "Payment verification failed";
      case "gateway-error":
        return "Payment gateway returned an error";
      default:
        return errorCode.replace(/-/g, " ");
    }
  };

  return (
    <div className="container mx-auto min-h-screen flex flex-col items-center justify-center py-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="w-full max-w-md"
      >
        <Card className="border-red-500 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Payment Failed
            </CardTitle>
            <CardDescription>We couldn't process your payment</CardDescription>
          </CardHeader>

          <CardContent className="text-center space-y-4 pt-4">
            <div className="bg-red-50 p-3 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 text-left">Error: {reason}</p>
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              Your payment was not processed successfully. Please try again or
              contact customer support if the problem persists.
            </p>
          </CardContent>

          <CardFooter className="flex justify-center space-x-4 pt-2">
            <Button asChild>
              <Link href="/subscription">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
