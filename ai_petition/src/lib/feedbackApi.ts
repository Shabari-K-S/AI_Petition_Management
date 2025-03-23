import { ApiResponse } from './types';

// Define Feedback types
export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  message: string;
  rating: number;
  category: 'usability' | 'performance' | 'features' | 'design' | 'other';
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackStatistics {
  totalCount: number;
  averageRating: number;
  categoryCount: {
    [key: string]: number;
  };
  ratingDistribution: {
    [key: string]: number;
  };
}

export interface FeedbackFormData {
  message: string;
  rating: number;
  category: 'usability' | 'performance' | 'features' | 'design' | 'other';
}

// Create api instance from your existing api.ts file
import api from './api'; // Import your existing api instance

// Feedback API endpoints
export const feedbackApi = {
  /**
   * Submit new feedback
   */
  submitFeedback: (feedbackData: FeedbackFormData) =>
    api.post<ApiResponse<{ feedback: Feedback }>>('/feedback', feedbackData),

  /**
   * Get all feedback with optional filtering
   * @param category Optional category filter
   * @param rating Optional rating filter
   */
  getFeedback: (category?: string, rating?: number) => {
    let url = '/feedback';
    const params = new URLSearchParams();
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    
    if (rating) {
      params.append('rating', rating.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return api.get<ApiResponse<{ feedback: Feedback[] }>>(url);
  },

  /**
   * Get feedback statistics
   */
  getFeedbackStatistics: () =>
    api.get<ApiResponse<{ statistics: FeedbackStatistics }>>('/feedback/statistics'),

  /**
   * Get feedback by ID
   */
  getFeedbackById: (id: string) =>
    api.get<ApiResponse<{ feedback: Feedback }>>(`/feedback/${id}`),

  /**
   * Update feedback
   */
  updateFeedback: (id: string, data: Partial<FeedbackFormData>) =>
    api.put<ApiResponse<{ feedback: Feedback }>>(`/feedback/${id}`, data),

  /**
   * Delete feedback
   */
  deleteFeedback: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/feedback/${id}`),
};

export default feedbackApi;