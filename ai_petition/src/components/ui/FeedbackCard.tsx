import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StarRating from "./StarRatings";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { cn } from "@/lib/utils";

export interface FeedbackItem {
  id: string;
  userName: string;
  rating: number;
  pros: string;
  cons: string;
  comment: string;
  createdAt: Date;
}

interface FeedbackCardProps {
  feedback: FeedbackItem;
  className?: string;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, className }) => {
  return (
    <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{feedback.userName}</CardTitle>
            <CardDescription>
              {formatDistanceToNow(feedback.createdAt, { addSuffix: true })}
            </CardDescription>
          </div>
          <StarRating rating={feedback.rating} readOnly size={16} />
        </div>
      </CardHeader>
      <CardContent>
        {feedback.pros && (
          <div className="mb-2">
            <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Pros</h4>
            <p className="text-sm mt-1">{feedback.pros}</p>
          </div>
        )}
        {feedback.cons && (
          <div className="mb-2">
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Cons</h4>
            <p className="text-sm mt-1">{feedback.cons}</p>
          </div>
        )}
        {feedback.comment && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Additional Comments</h4>
            <p className="text-sm mt-1">{feedback.comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackCard;