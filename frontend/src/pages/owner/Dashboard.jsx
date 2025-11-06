import Header from '../../components/shared/header';

const Dashboard = () => {
  return (
    <div className="p-8 min-h-screen">
      <Header 
        pageName="Dashboard"
        profileBackground="bg-gray-100"
        showBorder={false}
      />
      
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to the Dashboard</h2>
          <p className="text-gray-600">This page is under construction.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

