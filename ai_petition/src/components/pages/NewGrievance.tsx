/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewGrievanceFormData } from '@/lib/types';
import { grievanceApi } from '@/lib/api';
import axios from 'axios';
import Navbar from '../ui/AppNavbar';

const NewGrievance: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submittedGrievanceId, setSubmittedGrievanceId] = useState<string | null>(null);

  // List of category options (updated to match backend)
  const categoryOptions = [
    "Public Infrastructure & Utilities",
    "Government Services & Administration",
    "Consumer Rights & Product Issues",
    "Workplace & Employment Issues",
    "Education & Student Concerns",
    "Healthcare & Medical Services",
    "Law Enforcement & Justice",
    "Environmental & Safety Issues",
    "Housing & Real Estate",
    "Transportation & Public Safety",
    "Financial & Banking Issues",
    "Other"
  ];

  // Form state
  const [formData, setFormData] = useState<NewGrievanceFormData>({
    userId: localStorage.getItem("user"),
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    useAI: false,
    attachments: []
  });

  // File selection state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);

      console.log('Selected files:', fileList.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      })));

      // Explicitly ensure we're setting actual File objects
      setSelectedFiles(fileList);
      setFormData(prev => ({
        ...prev,
        attachments: fileList // Use the actual FileList
      }));
    }
  };
  // Remove a selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments ? prev.attachments.filter((_, i) => i !== index) : []
    }));
  };

  // Close success popup and navigate
  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    if (submittedGrievanceId) {
      navigate(`/grievances/${submittedGrievanceId}`);
    } else {
      navigate('/grievances');
    }
  };

  // Utility function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const parseAISuggestions = (response: any, currentFormData: NewGrievanceFormData): NewGrievanceFormData => {
    const updatedData = { ...currentFormData };

    try {
      // Enhanced title extraction
      const titleMatches = response.text.match(/Title:\s*(.+?)(?:\n|$)/i);
      if (titleMatches && titleMatches[1]) {
        updatedData.title = titleMatches[1].trim();
      }

      // Enhanced description extraction
      const descriptionMatches = response.text.match(/Description:\s*(.+?)(?:Category:|Priority:|$)/is);
      if (descriptionMatches && descriptionMatches[1]) {
        updatedData.description = descriptionMatches[1].trim();
      }

      // Category extraction
      const categoryMatches = response.text.match(/Category:\s*(.+?)(?:\n|$)/i);
      if (categoryMatches && categoryMatches[1]) {
        const suggestedCategory = categoryMatches[1].trim();
        if (categoryOptions.includes(suggestedCategory)) {
          updatedData.category = suggestedCategory;
        }
      }

      // Priority extraction with multiple fallback mappings
      const priorityMap: { [key: string]: 'low' | 'medium' | 'high' | 'urgent' } = {
        'low': 'low',
        'medium': 'medium',
        'high': 'high',
        'urgent': 'urgent',
        'critical': 'urgent'
      };

      const priorityMatches = response.text.match(/Priority:\s*(.+?)(?:\n|$)/i);
      if (priorityMatches && priorityMatches[1]) {
        const suggestedPriority = priorityMatches[1].trim().toLowerCase();

        // Find a matching priority
        const mappedPriority = Object.keys(priorityMap).find(key =>
          suggestedPriority.includes(key)
        );

        if (mappedPriority) {
          updatedData.priority = priorityMap[mappedPriority];
        }
      }

      return updatedData;
    } catch (error) {
      console.error('Error parsing AI suggestions:', error);
      return currentFormData;
    }
  };

  // New handler for AI Analysis
  const handleAIAnalysis = async () => {
    // Validate form has basic content
    if (!formData.title || !formData.description) {
      setError('Please fill in title and description before AI analysis');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      // Prepare form data for AI analysis
      const formDataToAnalyze = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        // Convert attachments to base64 if needed
        attachments: await Promise.all(
          (formData.attachments || []).map(async (file) => ({
            name: file.name,
            type: file.type,
            base64: await fileToBase64(file)
          }))
        )
      };

      // Use your actual Flask backend endpoint
      const response = await axios.post('http://localhost:5000/api/ai-analyze-grievance', formDataToAnalyze);

      // Parse Gemini's response and update form
      const updatedFormData = parseAISuggestions(response.data, formData);

      setFormData(updatedFormData);

      // Show AI suggestions in an alert (you might want to replace this with a more elegant UI)
      alert(response.data.text);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get AI analysis');
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ensure attachments are actual File objects
      const validAttachments = selectedFiles.filter(file => file instanceof File);

      const submissionData = {
        ...formData,
        attachments: validAttachments
      };

      console.log('Submission Data:', {
        ...submissionData,
        attachmentsCount: submissionData.attachments?.length || 0
      });

      const response = await grievanceApi.createGrievance(submissionData);
      // Rest of the submission logic remains the same
      if (response.data) {
        setSubmittedGrievanceId(response.data.grievance.id);

        // Reset form
        setFormData({
          userId: localStorage.getItem("user"),
          title: '',
          description: '',
          category: '',
          priority: 'medium',
          useAI: false,
          attachments: []
        });
        setSelectedFiles([]);

        setShowSuccessPopup(true);
      }
    } catch (err: any) {
      console.error('Submission Error:', err);
      setError(err.response?.data?.error || 'Failed to create grievance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-full mx-auto md:mt-18 mt-20 p-6 bg-gray-50 dark:bg-background-100">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-text-100">Submit New Grievance</h1>
  
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
  
        {/* Success Popup Component */}
        {showSuccessPopup && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-black dark:bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
  
              <div className="inline-block align-bottom bg-white dark:bg-background-200 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white dark:bg-background-200 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-text-100" id="modal-title">
                        Success!
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-text-200">
                          Your grievance has been submitted successfully. You will be redirected to view the details.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-background-300 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleClosePopup}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 dark:bg-primary-100 text-base font-medium text-white hover:bg-indigo-700 dark:hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-primary-200 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    View Grievance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Rest of the form remains the same */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-background-200 shadow-sm rounded-lg px-8 pt-6 pb-8 mb-4">
          {/* Title */}
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-text-100 text-sm font-medium mb-2" htmlFor="title">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="shadow-sm border border-gray-300 dark:border-background-300 rounded-md w-full py-2 px-3 text-gray-700 dark:text-text-100 dark:bg-background-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-primary-100 focus:border-indigo-500 transition duration-150"
              placeholder="Brief title of your grievance"
              required
            />
          </div>
  
          {/* Description */}
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-text-100 text-sm font-medium mb-2" htmlFor="description">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="shadow-sm border border-gray-300 dark:border-background-300 rounded-md w-full py-2 px-3 text-gray-700 dark:text-text-100 dark:bg-background-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-primary-100 focus:border-indigo-500 transition duration-150"
              placeholder="Provide details about your grievance"
              rows={6}
              required
            />
          </div>
  
          {/* Two column layout for Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Category */}
            <div>
              <label className="block text-gray-700 dark:text-text-100 text-sm font-medium mb-2" htmlFor="category">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="shadow-sm border border-gray-300 dark:border-background-300 rounded-md w-full py-2 px-3 text-gray-700 dark:text-text-100 dark:bg-background-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-primary-100 focus:border-indigo-500 transition duration-150"
                required
              >
                <option value="">Select a category</option>
                {categoryOptions.map(category => (
                  <option key={category} value={category} className="dark:bg-background-200 dark:text-text-100">
                    {category}
                  </option>
                ))}
              </select>
            </div>
  
            {/* Priority */}
            <div>
              <label className="block text-gray-700 dark:text-text-100 text-sm font-medium mb-2" htmlFor="priority">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="shadow-sm border border-gray-300 dark:border-background-300 rounded-md w-full py-2 px-3 text-gray-700 dark:text-text-100 dark:bg-background-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-primary-100 focus:border-indigo-500 transition duration-150"
                required
              >
                <option value="low" className="dark:bg-background-200 dark:text-text-100">Low</option>
                <option value="medium" className="dark:bg-background-200 dark:text-text-100">Medium</option>
                <option value="high" className="dark:bg-background-200 dark:text-text-100">High</option>
                <option value="urgent" className="dark:bg-background-200 dark:text-text-100">Urgent</option>
              </select>
            </div>
          </div>
  
          {/* AI Analysis Option */}
          <div className="mb-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="useAI"
                checked={formData.useAI}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 dark:text-primary-100 focus:ring-indigo-500 dark:focus:ring-primary-100 border-gray-300 dark:border-background-300 rounded transition duration-150"
              />
              <span className="text-sm text-gray-700 dark:text-text-200">Use AI to analyze and provide recommendations</span>
            </label>
          </div>
  
          {/* File Attachments */}
          <div className="mb-8">
            <label className="block text-gray-700 dark:text-text-100 text-sm font-medium mb-2">
              Attachments
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-background-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-text-200" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-text-200">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-background-200 rounded-md font-medium text-indigo-600 dark:text-primary-100 hover:text-indigo-500 dark:hover:text-primary-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-primary-100">
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".txt,.pdf,.png,.jpg,.jpeg,.doc,.docx"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-text-200">
                  PNG, JPG, PDF, DOC up to 10MB
                </p>
              </div>
            </div>
  
            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-text-100">Selected Files:</h3>
                <ul className="divide-y divide-gray-200 dark:divide-background-300">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-text-200 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-text-100 truncate max-w-xs">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-gray-400 dark:text-text-200 hover:text-red-500 dark:hover:text-red-400 transition duration-150"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
  
          {/* Submit and Cancel Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/grievances')}
              className="py-2 px-4 bg-white dark:bg-background-300 border border-gray-300 dark:border-background-200 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-text-100 hover:bg-gray-50 dark:hover:bg-background-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-primary-100 transition duration-150"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleAIAnalysis}
              disabled={aiLoading}
              className={`py-2 px-4 bg-emerald-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ${aiLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {aiLoading ? 'Analyzing...' : 'AI Suggest'}
            </button>

            <button
              type="submit"
              className={`py-2 px-6 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default NewGrievance;
