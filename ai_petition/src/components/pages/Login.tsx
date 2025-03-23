import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

const Login = () => {
  const { user, setUser, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log(import.meta.env.VITE_BACKEND_URL)
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok && data.user) {
        setUser(data.user);      
        console.log(user);
        localStorage.setItem("token", data.token); // 🔥 Store token in localStorage
        localStorage.setItem("user", data.user?.id);
        toast.success("Login successful!");
        navigate("/");
      } else {
        toast.error(data.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // If auth is still loading, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-background-200 border border-slate-200 dark:border-background-300 rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-text-100">Welcome back</h1>
            <p className="text-slate-500 dark:text-text-200">Sign in to your account</p>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-text-200">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-text-200" />
                  <Input 
                    id="email" 
                    name="email" 
                    placeholder="Enter your email" 
                    className="pl-10 bg-white dark:bg-background-200 border-slate-300 dark:border-background-300 text-black dark:text-text-100" 
                    required 
                    onChange={handleChange} 
                    value={formData.email}
                  />
                </div>
              </div>
  
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-text-200">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-text-200" />
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="Enter your password" 
                    className="pl-10 bg-white dark:bg-background-200 border-slate-300 dark:border-background-300 text-black dark:text-text-100" 
                    required 
                    onChange={handleChange} 
                    value={formData.password}
                  />
                </div>
              </div>
            </div>
  
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="text-blue-600 border-slate-300 dark:border-background-300" />
                <label htmlFor="remember" className="text-sm text-slate-600 dark:text-text-200">Remember me</label>
              </div>
              <Link to="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-primary-200 hover:text-blue-500 dark:hover:text-primary-100 hover:underline">
                Forgot password?
              </Link>
            </div>
  
            <Button 
              type="submit" 
              className="w-full bg-blue-600 dark:bg-primary-100 hover:bg-blue-700 dark:hover:bg-primary-200 text-white py-2 px-4 rounded-md flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Sign in</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform" />
                </div>
              )}
            </Button>
  
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-background-300"></div>
              </div>
              <div className="relative px-4 bg-white dark:bg-background-200">
                <p className="text-sm text-slate-500 dark:text-text-200">Don't have an account?</p>
              </div>
            </div>
  
            <Link to="/signup" className="block w-full">
              <Button 
                type="button"
                variant="outline"
                className="w-full border border-blue-200 dark:border-primary-100 bg-blue-50 dark:bg-background-300 text-blue-600 dark:text-primary-200 hover:bg-blue-100 dark:hover:bg-background-300 py-2 px-4 rounded-md"
              >
                Create an account
              </Button>
            </Link>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-500 dark:text-text-200 mt-6">
          By signing in, you agree to our <Link to="/terms" className="text-blue-600 dark:text-primary-200 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 dark:text-primary-200 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;