import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StarRating from "./StarRatings";
import { toast } from "sonner";
import { FeedbackItem } from "./FeedbackCard";
import { v4 as uuidv4 } from "uuid";

interface FeedbackFormProps {
  onSubmit: (feedback: FeedbackItem) => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit }) => {
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(0);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    setIsSubmitting(true);
    
    // Create new feedback object
    const newFeedback: FeedbackItem = {
      id: uuidv4(),
      userName,
      rating,
      pros,
      cons,
      comment,
      createdAt: new Date(),
    };
    
    // Submit feedback
    onSubmit(newFeedback);
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card animate-slide-up">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Share Your Feedback</CardTitle>
          <CardDescription>
            Help us improve our AI petition system by sharing your experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/30"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rating">Rating</Label>
            <div id="rating" className="flex items-center">
              <StarRating rating={rating} setRating={setRating} />
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pros">What did you like? (Pros)</Label>
            <Textarea
              id="pros"
              placeholder="What aspects of the system worked well for you?"
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              className="transition-all duration-300 min-h-24 focus:ring-2 focus:ring-primary/30"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cons">What could be improved? (Cons)</Label>
            <Textarea
              id="cons"
              placeholder="What aspects could be improved?"
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              className="transition-all duration-300 min-h-24 focus:ring-2 focus:ring-primary/30"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Any other thoughts you'd like to share..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="transition-all duration-300 min-h-24 focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full transition-all duration-300 hover:shadow-md hover:scale-[1.01]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default FeedbackForm;