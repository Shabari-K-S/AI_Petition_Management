/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
}

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  
  // Initialize with "Civilian" as the default value for role and department
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Civilian",
    department: "Civilian"
  });
  
  if (user) {
    navigate("/");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!formData.name || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.role || !formData.department) {
      toast("Required Fields", { description: "Please fill in all required fields" });
      return;
    }
    
    if (formData.password.length < 8) {
      toast("Password Too Short", { description: "Password must be at least 8 characters long" });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast("Password Mismatch", { description: "Passwords do not match" });
      return;
    }

    // Remove confirmPassword from the data sent to the API
    const { confirmPassword, ...submitData } = formData;

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      if (response.ok) {
        toast("Account Created", { description: "You have successfully signed up!" });
        navigate("/login");
      } else {
        toast("Signup Failed", { description: result.error || "Registration failed" });
      }
    } catch (error) {
      console.log(error);
      toast("Signup Failed", { description: "Something went wrong. Try again!" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-background-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-background-200 border border-slate-200 dark:border-background-300 rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-text-100">Create an account</h1>
            <p className="text-slate-500 dark:text-text-200">Sign up to get started</p>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-text-100">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-text-200" />
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="John Doe" 
                    className="pl-10 bg-white dark:bg-background-300 border-slate-300 dark:border-background-300 rounded-md" 
                    value={formData.name}
                    required 
                    onChange={handleChange} 
                  />
                </div>
              </div>
  
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-text-100">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-text-200" />
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    className="pl-10 bg-white dark:bg-background-300 border-slate-300 dark:border-background-300 rounded-md" 
                    value={formData.email}
                    required 
                    onChange={handleChange} 
                  />
                </div>
              </div>
  
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-text-100">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-text-200" />
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-white dark:bg-background-300 border-slate-300 dark:border-background-300 rounded-md" 
                    value={formData.password}
                    required 
                    onChange={handleChange} 
                  />
                </div>
              </div>
  
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-text-100">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-text-200" />
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-white dark:bg-background-300 border-slate-300 dark:border-background-300 rounded-md" 
                    value={formData.confirmPassword}
                    required 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </div>
  
            <Button 
              type="submit" 
              className="w-full bg-primary-100 hover:bg-primary-200 dark:bg-primary-100 dark:hover:bg-primary-200 text-white py-2 px-4 rounded-md flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Sign Up</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform" />
                </div>
              )}
            </Button>
  
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-background-300"></div>
              </div>
              <div className="relative px-4 bg-white dark:bg-background-200">
                <p className="text-sm text-slate-500 dark:text-text-200">Already have an account?</p>
              </div>
            </div>
  
            <Link to="/login" className="block w-full">
              <Button 
                type="button"
                variant="outline"
                className="w-full border border-primary-200 bg-primary-300 dark:bg-background-300 dark:border-accent-100 text-primary-100 dark:text-accent-100 hover:bg-primary-200 dark:hover:bg-background-200 py-2 px-4 rounded-md"
              >
                Sign in
              </Button>
            </Link>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-500 dark:text-text-200 mt-6">
          By signing up, you agree to our <Link to="/terms" className="text-primary-100 dark:text-accent-100 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary-100 dark:text-accent-100 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;