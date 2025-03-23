// api.ts - API service for making requests to the backend

import axios from 'axios';
import { Grievance, Statistics, User, Comment, Attachment, ApiResponse, NewGrievanceFormData } from './types';


// Create axios instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication endpoints
export const authApi = {
  login: (email: string, password: string) => 
    api.post<ApiResponse<{ user: User; token: string }>>('/users/login', { email, password }),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
  }) => api.post<ApiResponse<{ user: User; token: string }>>('/users/register', userData),
  
  getCurrentUser: () => 
    api.get<ApiResponse<{ user: User }>>('/users/me'),
};

// Grievances endpoints
export const grievanceApi = {
  createGrievance: (grievanceData: NewGrievanceFormData) => {
    const { attachments, ...grievanceSubmissionData } = grievanceData;
  
    console.log('Grievance Submission Data:', grievanceSubmissionData);
    console.log('Attachments:', attachments);
    console.log('Attachments type:', typeof attachments);
    console.log('Attachments instanceof:', attachments instanceof File);
  
    // First, create the grievance
    return api.post<ApiResponse<{ grievance: Grievance }>>('/grievances', grievanceSubmissionData)
      .then(response => {
        console.log('Grievance Creation Response:', response);
        
        const grievance = response.data?.grievance;
        console.log(response);
        console.log('Grievance:', grievance);
        
        // Detailed attachment handling
        if (grievance && attachments) {
          console.log('Attempting to process attachments');
          
          // More robust file checking
          let validFiles: File[] = [];
          
          if (attachments instanceof FileList) {
            validFiles = Array.from(attachments);
          } else if (Array.isArray(attachments)) {
            validFiles = attachments.filter(file => file instanceof File);
          } else if (attachments instanceof File) {
            validFiles = [attachments];
          }
  
          console.log('Valid files for upload:', validFiles);
          console.log('Number of valid files:', validFiles.length);
  
          if (validFiles.length > 0) {
            const uploadPromises = validFiles.map(file => {
              console.log('Preparing to upload file:', file.name);
              
              const formData = new FormData();
              formData.append('file', file);
              
              return api.post(`/grievances/${grievance.id}/attachments`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }).then(uploadResponse => {
                console.log(`File ${file.name} upload response:`, uploadResponse);
                return uploadResponse;
              }).catch(error => {
                console.error(`File upload error for ${file.name}:`, error.response?.data || error.message);
                throw error;
              });
            });
  
            return Promise.all(uploadPromises)
              .then(uploadResponses => {
                console.log('All files uploaded successfully');
                return response;
              })
              .catch(uploadError => {
                console.error('File upload errors:', uploadError);
                return response;
              });
          }
        }
        
        return response;
      })
      .catch(error => {
        console.error('Grievance creation error:', error.response?.data || error.message);
        throw error;
      });
  },
  
  getGrievances: (limit = 50, offset = 0) => 
    api.get<ApiResponse<{ grievances: Grievance[] }>>(`/grievances?limit=${limit}&offset=${offset}`),
  
  filterGrievances: (filters: Record<string, string>, limit = 50, offset = 0) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());
    
    return api.get<ApiResponse<{ grievances: Grievance[] }>>(`/grievances/filter?${queryParams.toString()}`);
  },
  
  getGrievance: (id: number) => 
    api.get<ApiResponse<{ 
      grievance: Grievance; 
      comments: Comment[]; 
      attachments: Attachment[] 
    }>>(`/grievances/${id}`),
  
  updateGrievance: (id: number, data: Partial<Grievance>) => 
    api.put<ApiResponse<{ grievance: Grievance }>>(`/grievances/${id}`, data),
  
  getAIAnalysis: (id: number) => 
    api.post<ApiResponse<{ 
      grievance: Grievance; 
      ai_summary: string; 
      ai_recommendation: string 
    }>>(`/grievances/${id}/ai-analysis`),
  
  addComment: (grievanceId: number, content: string) => 
    api.post<ApiResponse<{ comment: Comment }>>(`/grievances/${grievanceId}/comments`, { content }),
  
  getComments: (grievanceId: number) => 
    api.get<ApiResponse<{ comments: Comment[] }>>(`/grievances/${grievanceId}/comments`),
  
  uploadAttachment: (grievanceId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post<ApiResponse<{ attachment: Attachment }>>(
      `/grievances/${grievanceId}/attachments`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
  
  getAttachments: (grievanceId: number) => 
    api.get<ApiResponse<{ attachments: Attachment[] }>>(`/grievances/${grievanceId}/attachments`),
  
  downloadAttachment: (filename: string) => 
    `${api.defaults.baseURL}/uploads/${filename}`,
};

// Statistics endpoints
export const statisticsApi = {
  getStatistics: () => 
    api.get<ApiResponse<Statistics>>('/statistics'),
};

export default api;