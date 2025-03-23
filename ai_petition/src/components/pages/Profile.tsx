/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User } from '@/lib/types';
import Navbar from '../ui/AppNavbar';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUser(response.data.user);
        console.log(response.data.user);
        setFormData({
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          department: response.data.user.department || '',
          password: '',
          confirmPassword: ''
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile. Please try again later.');
        setLoading(false);
        
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };
    
    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setUpdateSuccess(false);
    setUpdateError(null);
    
    // Reset form data when cancelling edit
    if (editMode && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        password: '',
        confirmPassword: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateSuccess(false);
    setUpdateError(null);
    
    // Validation
    const validationErrors: string[] = [];
    
    if (!formData.name || formData.name.trim().length < 2) {
      validationErrors.push('Name must be at least 2 characters long');
    }
    
    if (!formData.department || formData.department.trim().length < 2) {
      validationErrors.push('Department must be at least 2 characters long');
    }
    
    // Password validation (if changing)
    if (formData.password) {
      if (formData.password.length < 8) {
        validationErrors.push('Password must be at least 8 characters long');
      }
      
      if (formData.password !== formData.confirmPassword) {
        validationErrors.push('Passwords do not match');
      }
    }
    
    // Stop if validation fails
    if (validationErrors.length > 0) {
      setUpdateError(validationErrors.join('. '));
      return;
    }
    
    // Prepare update data
    const updateData: any = {
      name: formData.name.trim(),
      department: formData.department.trim()
    };
    
    // Add password if changing
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${user?.id}`, 
        updateData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        ...response.data.user
      }));
      
      setUpdateSuccess(true);
      setEditMode(false);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err: any) {
      console.error('Error updating profile:', err);
      
      // Handle error responses
      if (err.response) {
        const errorMessage = err.response.data.error || 
                             err.response.data.message || 
                             'Failed to update profile';
        setUpdateError(errorMessage);
      } else {
        setUpdateError('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Get first letter of name for avatar
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Generate random gradient background for avatar
  const getAvatarBg = () => {
    const colors = [
      'from-purple-500 to-indigo-600',
      'from-blue-500 to-teal-400',
      'from-green-500 to-lime-400',
      'from-pink-500 to-rose-400',
      'from-amber-500 to-yellow-400'
    ];
    // Use user's name to consistently get the same color
    const index = user?.name ? user.name.length % colors.length : 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md" role="alert">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Something went wrong</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-full min-h-screen dark:bg-background-100">
      <Navbar />
      <div className="min-h-screen dark:bg-background-100 py-30 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-background-100 rounded-2xl shadow-xl overflow-hidden">
            
            {/* Profile Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 sm:px-10 sm:py-12">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className={`h-24 w-24 rounded-full bg-gradient-to-br ${getAvatarBg()} flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-4 sm:mb-0 sm:mr-6`}>
                  {getInitial(user.name)}
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl font-extrabold text-white">{user?.name || 'User'}</h1>
                  <p className="text-indigo-100 mt-1">{user?.email || 'N/A'}</p>
                  <p className="text-indigo-200 text-sm mt-2 capitalize">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {user?.role || 'User'}
                    </span>
                  </p>
                </div>
                <div className="sm:ml-auto mt-4 sm:mt-0">
                  <button
                    onClick={toggleEditMode}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      editMode 
                        ? 'bg-white text-indigo-700 hover:bg-gray-100 dark:bg-background-200 dark:text-indigo-400' 
                        : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Area */}
            {(updateSuccess || updateError) && (
              <div className={`px-6 py-3 ${updateSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
                {updateSuccess && (
                  <div className="flex items-center text-green-700">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Profile updated successfully!</span>
                  </div>
                )}
                
                {updateError && (
                  <div className="flex items-center text-red-700 dark:bg-background-100 dark:text-red-400">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{updateError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Profile Content */}
            <div className="p-6 sm:p-10 dark:bg-background-200 dark:text-white">
              {editMode ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300" htmlFor="name">
                        Full Name
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700  dark:text-zinc-300" htmlFor="email">
                        Email Address
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          disabled
                          className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11 bg-gray-50 text-gray-500 dark:bg-background-300"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700  dark:text-zinc-300" htmlFor="department">
                        Department
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700  dark:text-zinc-300" htmlFor="password">
                        New Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
                          placeholder="Leave blank to keep current password"
                          minLength={8}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                          >
                            {showPassword ? (
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700  dark:text-zinc-300" htmlFor="confirmPassword">
                        Confirm New Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11"
                          placeholder="Leave blank to keep current password"
                          minLength={8}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="ml-3 inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 dark:bg-background-200">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <h2 className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Name</h2>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white">{user?.name || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h2 className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Email</h2>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white">{user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h2 className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Department</h2>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white">{user?.department || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h2 className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Account Created</h2>
                      </div>
                      <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white">
                        {user?.created_at 
                          ? new Date(user.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer Area */}
            <div className="bg-gray-50 dark:bg-background-300 dark:text-white px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-white">
                Last updated: {user.updated_at 
                  ? new Date(user.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </div>
              
              {!editMode && (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center dark:text-indigo-300 "
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default ProfilePage;