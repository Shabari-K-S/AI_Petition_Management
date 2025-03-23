/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integeration/supabase/client";
import { FeedbackItem } from "@/components/ui/FeedbackCard";

// Convert Supabase response to FeedbackItem
const convertToFeedbackItem = (item: any): FeedbackItem => ({
  id: item.id,
  userName: item.user_name,
  rating: item.rating,
  pros: item.pros || "",
  cons: item.cons || "",
  comment: item.comment || "",
  createdAt: new Date(item.created_at)
});

// Get all feedback from Supabase
export const getAllFeedback = async (): Promise<FeedbackItem[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching feedback:", error);
      return [];
    }
    
    return (data || []).map(convertToFeedbackItem);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return [];
  }
};

// Add new feedback to Supabase
export const addFeedback = async (feedback: Omit<FeedbackItem, "id" | "createdAt">): Promise<FeedbackItem | null> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_name: feedback.userName,
        rating: feedback.rating,
        pros: feedback.pros,
        cons: feedback.cons,
        comment: feedback.comment
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error submitting feedback:", error);
      return null;
    }
    
    return convertToFeedbackItem(data);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return null;
  }
};

// Delete feedback from Supabase
export const deleteFeedback = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);
    
    return !error;
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return false;
  }
};

// Get feedback statistics from Supabase
export const getFeedbackStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_feedback_stats');
    
    if (error) {
      console.error("Error fetching feedback stats:", error);
      return {
        totalCount: 0,
        averageRating: 0,
        ratingCounts: [0, 0, 0, 0, 0]
      };
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return {
      totalCount: 0,
      averageRating: 0,
      ratingCounts: [0, 0, 0, 0, 0]
    };
  }
};