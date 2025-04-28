import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto min-h-screen flex flex-col items-center justify-center py-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.1
        }}
        className="w-full max-w-md"
      >
        <Card className="border-green-500 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Payment Successful!</CardTitle>
            <CardDescription>Your subscription has been activated</CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-2 pt-4">
            <p>Thank you for subscribing to Mirxa.io.</p>
            <p>You now have full access to all premium features.</p>
            <p className="text-sm text-muted-foreground mt-4">
              A confirmation email with your receipt will be sent to your registered email address.
            </p>
          </CardContent>
          
          <CardFooter className="flex justify-center space-x-4 pt-2">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/subscription">View Subscription</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}