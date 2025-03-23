const StatCard = ({ title, value, icon, color }:{title: string, value: string, icon: React.ReactNode, color: string}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      <div className={`${color} text-white p-4 rounded-lg text-2xl mr-4`}>
        {icon}
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;