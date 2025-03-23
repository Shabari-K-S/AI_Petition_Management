/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import api  from "@/lib/api";
import Navbar from "../ui/AppNavbar";
import { Plus } from "lucide-react";

const GrievancePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    const fetchGrievances = async () => {
      try {
        const response = await api.get(`/grievances`);
        setGrievances(response.data.grievances);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.log(err)
      }
    };

    fetchGrievances();
  }, [user, navigate]);

  return (
    <div className="min-h-screen w-full dark:bg-background-100">
     <Navbar />
     <div className="container mx-auto mt-16 px-4 py-6 bg-white dark:bg-background-100 text-black dark:text-text-100">
       <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-bold mb-4 dark:text-text-100">Grievances</h1>
         <Link 
           to={"/grievance/new"} 
           className="flex items-center gap-2 bg-primary-100 dark:bg-primary-100/20 text-white dark:text-primary-200 px-3 py-1 rounded-lg shadow-md hover:bg-primary-200 dark:hover:bg-primary-100/30 transition duration-200 mt-5"
         >
           <Plus className="w-8 h-8" />
           New Grievance
         </Link>
       </div>
       <div className="bg-white dark:bg-background-200 rounded-lg shadow p-4">
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
               <tbody className="bg-white dark:bg-background-200 divide-y divide-gray-200 dark:divide-background-300">
                 {grievances.length > 0 ? (
                   grievances.map((grievance: any) => (
                     <tr key={grievance.id} className="hover:bg-gray-50 dark:hover:bg-background-300">
                       <td className="px-6 py-4 whitespace-nowrap dark:text-text-100">{grievance.title}</td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 rounded-full text-xs ${
                           grievance.status === 'resolved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                           grievance.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                           grievance.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                           'bg-gray-100 dark:bg-background-300 text-gray-800 dark:text-text-200'
                         }`}>
                           {grievance.status.replace('_', ' ')}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 rounded-full text-xs ${
                          grievance.priority === 'urgent' ? 'bg-red-500 dark:bg-red-900 text-white dark:text-red-200' :
                          grievance.priority === 'high' ? `bg-[#0085ff] dark:bg-[#0085ff]/20 text-white dark:text-[#69b4ff]` :
                          grievance.priority === 'medium' ? `bg-[#006fff] dark:bg-[#006fff]/20 text-white dark:text-[#e1ffff]` :
                          `bg-green-500 dark:bg-background-300 text-white dark:text-text-200`
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

export default GrievancePage;