/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

const UserDashboard = () => {
  // Sample grievance data - replace with your actual data
  const [grievances, setGrievances] = useState<any[]>([]);

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const response = await fetch('/api/grievances');
        console.log(response);
        const data = await response.json();
        setGrievances(data);
      } catch (error) {
        console.error('Error fetching grievances:', error);
      }
    };

    fetchGrievances();
  }, []);

  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-purple-100 text-purple-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredGrievances = grievances.filter(grievance => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return ['New', 'Under Review', 'In Progress'].includes(grievance.status);
    if (activeTab === 'resolved') return grievance.status === 'Resolved';
    if (activeTab === 'closed') return grievance.status === 'Closed';
    return true;
  });

  const statusCounts = {
    new: grievances.filter(g => g.status === 'New').length,
    inProgress: grievances.filter(g => ['Under Review', 'In Progress'].includes(g.status)).length,
    resolved: grievances.filter(g => g.status === 'Resolved').length,
    closed: grievances.filter(g => g.status === 'Closed').length
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Grievance Management Dashboard</h1>
      
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Grievance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-500">New</p>
            <p className="text-3xl font-bold">{statusCounts.new}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-gray-500">In Progress</p>
            <p className="text-3xl font-bold">{statusCounts.inProgress}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-gray-500">Resolved</p>
            <p className="text-3xl font-bold">{statusCounts.resolved}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-500">Closed</p>
            <p className="text-3xl font-bold">{statusCounts.closed}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + New Grievance
          </button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
            Export Report
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search grievances..." 
            className="border rounded py-2 px-4 pl-10"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            <button 
              onClick={() => setActiveTab('all')} 
              className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              All Grievances
            </button>
            <button 
              onClick={() => setActiveTab('open')} 
              className={`px-4 py-2 font-medium ${activeTab === 'open' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Open
            </button>
            <button 
              onClick={() => setActiveTab('resolved')} 
              className={`px-4 py-2 font-medium ${activeTab === 'resolved' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Resolved
            </button>
            <button 
              onClick={() => setActiveTab('closed')} 
              className={`px-4 py-2 font-medium ${activeTab === 'closed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Closed
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGrievances.map(grievance => (
                  <tr 
                    key={grievance.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedGrievance(grievance)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">GR-{grievance.id.toString().padStart(4, '0')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{grievance.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{grievance.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(grievance.priority)}`}>
                        {grievance.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(grievance.status)}`}>
                        {grievance.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(grievance.submittedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(grievance.lastUpdated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {selectedGrievance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">GR-{selectedGrievance.id.toString().padStart(4, '0')}</h2>
                  <p className="text-lg font-medium mt-1">{selectedGrievance.subject}</p>
                </div>
                <button 
                  onClick={() => setSelectedGrievance(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>
              
              <div className="mt-6">
                <div className="flex space-x-4 mb-6">
                  <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedGrievance.status)}`}>
                    {selectedGrievance.status}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedGrievance.priority)}`}>
                    {selectedGrievance.priority}
                  </span>
                  <span className="inline-flex px-2 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                    {selectedGrievance.category}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedGrievance.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Submitted Date</p>
                    <p className="font-medium">{formatDate(selectedGrievance.submittedDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(selectedGrievance.lastUpdated)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="font-medium">{selectedGrievance.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Attachments</p>
                    <p className="font-medium">{selectedGrievance.attachments} files</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Comments ({selectedGrievance.comments})</h3>
                  {selectedGrievance.comments > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <p className="font-medium">HR Manager</p>
                          <p className="text-sm text-gray-500">Feb 24, 2025</p>
                        </div>
                        <p className="mt-2">We are reviewing your case and will provide an update soon.</p>
                      </div>
                      {selectedGrievance.comments > 1 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <p className="font-medium">You</p>
                            <p className="text-sm text-gray-500">Feb 23, 2025</p>
                          </div>
                          <p className="mt-2">Thank you for looking into this issue. I've attached additional documentation for reference.</p>
                        </div>
                      )}
                      {selectedGrievance.comments > 2 && (
                        <p className="text-blue-600 cursor-pointer">Show all comments</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No comments yet</p>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Add Comment
                    </button>
                    <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                      Add Attachment
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    {selectedGrievance.status !== 'Resolved' && selectedGrievance.status !== 'Closed' && (
                      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Mark as Resolved
                      </button>
                    )}
                    {selectedGrievance.status === 'Resolved' && (
                      <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                        Close Grievance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;