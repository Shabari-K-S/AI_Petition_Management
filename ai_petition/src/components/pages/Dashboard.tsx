// Dashboard.tsx - The main dashboard component
import React, { useEffect, useState } from 'react';
import { Statistics, Grievance } from '@/lib/types';
import { statisticsApi, grievanceApi } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Doughnut, Pie } from 'react-chartjs-2';
import Navbar from '@/components/ui/AppNavbar';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentGrievances, setRecentGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

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
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch statistics
        const statsResponse = await statisticsApi.getStatistics();
        console.log("S", statsResponse);
        if (statsResponse.data) {
          setStatistics(statsResponse.data);
        }

        // Fetch recent grievances (more detailed than the summary in stats)
        const grievancesResponse = await grievanceApi.getGrievances(5, 0);
        console.log("G", grievancesResponse);
        if (grievancesResponse.data) {
          setRecentGrievances(grievancesResponse.data.grievances);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
        console.error('Dashboard data fetch error:', err);
      }
    };

    const fetchUser = async () => {
      const userInfo = await getUserInfo();
      setUserRole(userInfo.role);
      console.log(userInfo.role)
    };

    fetchUser();

    fetchDashboardData();
  }, []);

  // Prepare chart data
  const getStatusChartData = () => {
    if (!statistics) return null;

    const colors = statistics.by_status.map((_, i) =>
      `hsl(${(i * 60) % 360}, 70%, 60%)` // Dynamic colors based on index
    );

    return {
      labels: statistics.by_status.map(item => item.status),
      datasets: [
        {
          label: 'Grievances by Status',
          data: statistics.by_status.map(item => item.count),
          backgroundColor: colors, // Unique color per status
          borderColor: colors.map(color => color.replace("60%", "40%")), // Darker border
          borderWidth: 1,
        },
      ],
    };
  };

  const getPriorityChartData = () => {
    if (!statistics) return null;

    const colors = statistics.by_priority.map((_, i) =>
      `hsl(${(i * 90) % 360}, 70%, 60%)` // Different step for better variation
    );

    return {
      labels: statistics.by_priority.map(item => item.priority),
      datasets: [
        {
          label: 'Grievances by Priority',
          data: statistics.by_priority.map(item => item.count),
          backgroundColor: colors, // Unique color per priority
          borderColor: colors.map(color => color.replace("60%", "40%")), // Darker border
          borderWidth: 1,
        },
      ],
    };
  };


  const getCategoryChartData = () => {
    if (!statistics) return null;

    // Generate unique colors for each category dynamically
    const colors = statistics.by_category.map((_, i) =>
      `hsl(${(i * 45) % 360}, 70%, 60%)` // Varying hue for each category
    );

    return {
      labels: statistics.by_category.map(item => item.category),
      datasets: [
        {
          label: 'Grievances by Category',
          data: statistics.by_category.map(item => item.count),
          backgroundColor: colors, // Unique color per category
          borderColor: colors.map(color => color.replace("60%", "40%")), // Darker border
          borderWidth: 1,
        },
      ],
    };
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="bg-white dark:bg-background-100 text-black dark:text-text-100">
      <Navbar />
      <div className='p-6 mt-16'>
        <h1 className="text-3xl font-bold mb-6 dark:text-text-100">Grievance Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Grievances', value: statistics?.total_grievances || 0 },
            { label: 'Open Grievances', value: statistics?.by_status.find(s => s.status === 'Pending')?.count || 0 },
            { label: 'In Progress', value: statistics?.by_status.find(s => s.status === 'In Progress')?.count || 0 },
            { label: 'Resolved', value: statistics?.by_status.find(s => s.status === 'Resolved')?.count || 0 }
          ].map((card, _) => (
            <div 
              key={card.label} 
              className="bg-gray-100 dark:bg-background-200 text-black dark:text-text-100 rounded-lg shadow p-4 card-hover"
            >
              <h2 className="text-gray-500 dark:text-text-200 text-sm font-medium">{card.label}</h2>
              <p className="text-3xl font-bold dark:text-text-100">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="flex md:flex-row flex-col justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
          {[
            { 
              title: 'Status Distribution', 
              chart: <Pie data={getStatusChartData() || { labels: [], datasets: [] }} /> 
            },
            { 
              title: 'Priority Distribution', 
              chart: <Pie data={getPriorityChartData() || { labels: [], datasets: [] }} /> 
            },
            { 
              title: 'Categories', 
              chart: <Doughnut data={getCategoryChartData() || { labels: [], datasets: [] }} /> 
            }
          ].map((section) => (
            <div 
              key={section.title} 
              className="bg-gray-100 dark:bg-background-200 text-black dark:text-text-100 rounded-lg shadow p-4 w-full card-hover"
            >
              <h2 className="text-lg font-semibold mb-4 dark:text-text-100">{section.title}</h2>
              {statistics && section.chart}
            </div>
          ))}
        </div>

        {/* Recent Grievances */}
        <div className="bg-white dark:bg-background-100 text-black dark:text-text-100 rounded-lg shadow p-4 mt-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-text-100">Recent Grievances</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-background-300">
              <thead className="bg-gray-50 dark:bg-background-200">
                <tr>
                  {['Title', 'Status', 'Priority', 'Created', 'Actions'].map((header) => (
                    <th 
                      key={header} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-text-200 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-background-300">
                {recentGrievances.length > 0 ? (
                  recentGrievances.map((grievance) => (
                    <tr key={grievance.id} className="hover:bg-gray-50 dark:hover:bg-background-200">
                      <td className="px-6 py-4 whitespace-nowrap dark:text-text-100">{grievance.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          grievance.status === 'Resolved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          grievance.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                          grievance.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                          'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                        }`}>
                          {grievance.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          grievance.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                          grievance.priority === 'high' ? `bg-primary-100 dark:bg-primary-100/20 text-white dark:text-primary-200` :
                          grievance.priority === 'medium' ? `bg-background-100 dark:bg-background-100/20 text-white dark:text-accent-200` :
                          'bg-gray-100 dark:bg-background-300 text-gray-800 dark:text-text-200'
                        }`}>
                          {grievance.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-text-100">
                        {new Date(grievance.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a 
                          href={`/grievances/${grievance.id}`} 
                          className="text-primary-100 hover:text-primary-200 dark:text-primary-200 dark:hover:text-primary-300"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-text-200">
                      No recent grievances
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;