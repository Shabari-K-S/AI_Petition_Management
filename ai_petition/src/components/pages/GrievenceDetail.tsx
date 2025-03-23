/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../ui/AppNavbar";
import axios from "axios";

interface Grievance {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  submitter?: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
}

const GrievanceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState<string>("");
  const statusOptions = ["Open", "In Progress", "Resolved", "Closed", "Pending"];

  const getUserInfo = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:5000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = response.data.user
      return data;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchGrievance = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        // read environment variable
        const url = import.meta.env.VITE_BACKEND_URL
        const response = await fetch(`${url}/api/grievances/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch grievance details");
        }

        const data = await response.json();
        setGrievance(data.grievance);
        setComments(data.comments);
        setAttachments(data.attachments);
        console.log(data);
      } catch (err: any) {
        console.log(err)
        setError("Error fetching grievance details");
      } finally {
        setLoading(false);
      }
    };
    const fetchUser = async () => {
        const userInfo = await getUserInfo();
        setUserRole(userInfo.role);
    };

    fetchUser();

    fetchGrievance();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !grievance) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const url = import.meta.env.VITE_BACKEND_URL
      await axios.put(
        `${url}/api/grievances/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGrievance((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      console.error("Error updating status", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || newComment.trim() === "") return;

    try {
      const token = localStorage.getItem("token");
      const url = import.meta.env.VITE_BACKEND_URL
      const response = await axios.post(
        `${url}/api/grievances/${id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, response.data.comment]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment", err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  );
  
  if (!grievance) return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-gray-600 font-medium">Grievance not found</p>
    </div>
  );

  return (
    <div className="w-full min-h-screen dark:bg-background-100 pt-30 pb-10 text-black dark:text-text-100">
        <Navbar />
        <div className="min-w-full min-h-[90vh] flex items-center justify-center bg-white dark:bg-background-100 text-black dark:text-text-100">
            <div className="flex-1 max-w-4xl mx-auto p-6 bg-white dark:bg-background-200 shadow-md rounded-lg">
            <div className="mb-6 border-b dark:border-background-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-text-100">{grievance.title}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    grievance.status === 'Open' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                    grievance.status === 'In Progress' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                    grievance.status === 'Resolved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    grievance.status === 'Closed' ? 'bg-gray-100 dark:bg-background-300 text-gray-800 dark:text-text-200' :
                    'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                }`}>
                    {grievance.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    grievance.priority === 'High' ? 'bg-[#0085ff] dark:bg-[#0085ff]/20 text-white dark:text-[#69b4ff]' :
                    grievance.priority === 'Medium' ? 'bg-[#006fff] dark:bg-[#006fff]/20 text-white dark:text-[#e1ffff]' :
                    'bg-green-100 dark:bg-background-300 text-green-800 dark:text-text-200'
                }`}>
                    {grievance.priority} Priority
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-background-300 text-gray-800 dark:text-text-200">
                    {grievance.category}
                </span>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-text-100 mb-2">Description</h2>
                <div className="bg-gray-50 dark:bg-background-300 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-text-200 whitespace-pre-line">{grievance.description}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 dark:bg-background-300 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-blue-800 dark:text-text-100 mb-2">Submission Details</h2>
                {grievance.submitter ? (
                    <div className="flex items-center gap-2">
                    <div className="bg-blue-200 dark:bg-background-200 text-blue-800 dark:text-text-100 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        {grievance.submitter.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-medium dark:text-text-100">{grievance.submitter.name}</p>
                        <p className="text-sm text-gray-600 dark:text-text-200">{grievance.submitter.email}</p>
                    </div>
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-text-200">No submitter information</p>
                )}
                </div>

                <div className="bg-purple-50 dark:bg-background-300 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-purple-800 dark:text-text-100 mb-2">Assignment</h2>
                {grievance.assignee ? (
                    <div className="flex items-center gap-2">
                    <div className="bg-purple-200 dark:bg-background-200 text-purple-800 dark:text-text-100 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        {grievance.assignee.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-medium dark:text-text-100">{grievance.assignee.name}</p>
                        <p className="text-sm text-gray-600 dark:text-text-200">{grievance.assignee.email}</p>
                    </div>
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-text-200">Not assigned</p>
                )}
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-text-100 mb-3 flex items-center">
                <span>Comments</span>
                <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-background-300 text-gray-700 dark:text-text-200 rounded-full text-xs">
                    {comments.length}
                </span>
                </h2>
                {comments.length > 0 ? (
                <div className="space-y-3">
                    {comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 dark:border-background-300 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-background-300 transition-colors">
                        <p className="text-gray-800 dark:text-text-100">{comment.content}</p>
                        <p className="text-xs text-gray-500 dark:text-text-200 mt-2">
                        {new Date(comment.created_at).toLocaleString()}
                        </p>
                    </div>
                    ))}
                </div>
                ) : (
                <p className="text-gray-500 dark:text-text-200 italic">No comments yet</p>
                )}
            </div>

            {userRole === "admin" && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-text-100 mb-2">Add Comment</h2>
                <textarea
                  className="w-full p-2 border rounded dark:bg-background-300 dark:text-text-100 dark:border-background-200"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment..."
                />
                <button
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleAddComment}
                >
                  Add Comment
                </button>
              </div>
            )}

            <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-text-100 mb-3 flex items-center">
                <span>Attachments</span>
                <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-background-300 text-gray-700 dark:text-text-200 rounded-full text-xs">
                    {attachments.length}
                </span>
                </h2>
                {attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((attachment) => (
                    <a 
                        href={`http://localhost:5000/images/${attachment.file_path}`} 
                        target="_blank" 
                        key={attachment.id}
                        className="flex items-center gap-2 p-3 border border-gray-200 dark:border-background-300 rounded-lg hover:bg-blue-50 dark:hover:bg-background-300 hover:border-blue-200 transition-colors"
                    >
                        <div className="bg-gray-100 dark:bg-background-300 p-2 rounded">
                        <svg className="w-5 h-5 text-gray-600 dark:text-text-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                        </svg>
                        </div>
                        <span className="text-blue-600 dark:text-primary-200 truncate">{attachment.filename}</span>
                    </a>
                    ))}
                </div>
                ) : (
                <p className="text-gray-500 dark:text-text-200 italic">No attachments</p>
                )}
            </div>
            {userRole === "admin" && (
            <select
              className="mt-4 p-2 border rounded dark:bg-background-300 dark:text-text-100 dark:border-background-200"
              value={grievance.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option} className="dark:bg-background-300 dark:text-text-100">{option}</option>
              ))}
            </select>
            )}
            </div>
        </div>
    </div>
  );
};

export default GrievanceDetails;