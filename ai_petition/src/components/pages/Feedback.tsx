import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedbackForm from "@/components/ui/FeedbackForm";
import FeedbackList from "@/components/ui/FeedbackList";
import { FeedbackItem } from "@/components/ui/FeedbackCard";
import { StarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllFeedback, addFeedback, getFeedbackStats } from "@/service/supabaseFeedbackService";
import { toast } from "sonner";
import Navbar from "../ui/AppNavbar";

const FeedbackPage = () => {
  const [activeTab, setActiveTab] = useState("view");
  const queryClient = useQueryClient();
  
  // Query for fetching feedback data
  const { data: feedbackItems = [] } = useQuery({
    queryKey: ['feedback'],
    queryFn: getAllFeedback
  });
  
  // Query for fetching feedback stats
  const { data: stats = { totalCount: 0, averageRating: 0, ratingCounts: [0, 0, 0, 0, 0] } } = useQuery({
    queryKey: ['feedbackStats'],
    queryFn: getFeedbackStats
  });
  
  // Mutation for adding new feedback
  const addFeedbackMutation = useMutation({
    mutationFn: (feedback: Omit<FeedbackItem, "id" | "createdAt">) => addFeedback(feedback),
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedbackStats'] });
      
      // Show success message
      toast.success("Feedback submitted successfully!");
      
      // Switch to view tab after submission
      setActiveTab("view");
    },
    onError: () => {
      toast.error("Failed to submit feedback. Please try again.");
    }
  });
  
  const handleFeedbackSubmit = (feedback: FeedbackItem) => {
    const { id, createdAt, ...feedbackData } = feedback;
    addFeedbackMutation.mutate(feedbackData);
  };
  
  console.log(stats)

  // Calculate percentage for each rating
  const calculatePercentage = (count: number) => {

    return stats.totalCount > 0 
      ? Math.round((count / stats.totalCount) * 100) 
      : 0;

  };

  return (
    <>
      <Navbar />
      <div className="bg-white dark:bg-background-100 text-black dark:text-text-100">
        <div className="max-w-5xl mx-auto py-6 mt-16">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2 dark:text-text-100">
              User Feedback
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto dark:text-text-200">
              We value your input! Share your experience with our AI petition system and see what others are saying.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-3 animate-slide-up bg-gray-100 dark:bg-background-200 text-black dark:text-text-100 rounded-lg shadow p-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold mb-4 dark:text-text-100">Feedback Summary</CardTitle>
                <CardDescription className="text-gray-500 dark:text-text-200">Overview of user ratings and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
                    <span className="text-2xl font-bold">{stats.totalCount}</span>
                    <span className="text-sm text-muted-foreground">Total Reviews</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
                      <StarIcon className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Average Rating</span>
                  </div>
                  
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm w-6">{rating}</span>
                        <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <Progress value={calculatePercentage(stats.ratingCounts[rating - 1])} className="h-2" />
                        <span className="text-sm w-8 text-right">
                          {calculatePercentage(stats.ratingCounts[rating - 1])}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="view" className="text-lg py-3">View Feedback</TabsTrigger>
              <TabsTrigger value="submit" className="text-lg py-3">Submit Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="view" className="animate-slide-in">
              <FeedbackList feedbackItems={feedbackItems} />
            </TabsContent>
            
            <TabsContent value="submit" className="animate-slide-in">
              <FeedbackForm onSubmit={handleFeedbackSubmit} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default FeedbackPage;