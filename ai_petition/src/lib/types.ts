// types.ts - Contains all TypeScript type definitions

// User types
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff' | 'employee';
    department: string;
    created_at: string;
  }
  
  // Grievance types
  export interface Grievance {
    id: number;
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_review' | 'in_progress' | 'resolved' | 'closed';
    submitted_by: number;
    assigned_to: number | null;
    created_at: string;
    updated_at: string;
    ai_summary: string | null;
    ai_recommendation: string | null;
    submitter?: User;
    assignee?: User;
  }
  
  // Comment types
  export interface Comment {
    id: number;
    grievance_id: number;
    user_id: number;
    content: string;
    created_at: string;
    user?: User;
  }
  
  // Attachment types
  export interface Attachment {
    id: number;
    grievance_id: number;
    original_filename: string;
    stored_filename: string;
    uploaded_by: number;
    created_at: string;
    uploader?: User;
  }
  
  // Statistics types
  export interface Statistics {
    total_grievances: number;
    by_status: Array<{ status: string; count: number }>;
    by_category: Array<{ category: string; count: number }>;
    by_priority: Array<{ priority: string; count: number }>;
    recent_grievances: Array<GrievanceSummary>;
  }
  
  export interface GrievanceSummary {
    id: number;
    title: string;
    status: string;
    priority: string;
    created_at: string;
  }
  
  // API response types
  export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
  }
  
  // Form types
  export interface NewGrievanceFormData {
    userId: string | null;
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    useAI: boolean;
    attachments?: File[];
  }