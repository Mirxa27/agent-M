import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient"; // Assuming you have a similar helper
import React, { useState } from "react";
import { Link, useLocation } from "wouter";

const AdminLoginPage: React.FC = () => {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await apiRequest<{ success: boolean; message?: string; error?: string }>(
                "POST",
                "/api/admin/login",
                { username, password }
            );

            if (response.success) {
                toast({
                    title: "Login Successful",
                    description: response.message || "Redirecting to admin dashboard...",
                });
                // Store some indication of admin login in localStorage or context if needed
                // For now, just navigate
                navigate("/admin/dashboard"); // Placeholder for admin dashboard
            } else {
                toast({
                    title: "Login Failed",
                    description: response.error || "Invalid credentials.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Admin login error:", error);
            toast({
                title: "Login Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
                    <CardDescription>Enter your administrator credentials.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center text-sm">
                    <Link href="/" className="text-primary hover:underline">
                        Back to site
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default AdminLoginPage;
