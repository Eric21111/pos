import Header from '../../components/shared/header';

const Reports = () => {
  return (
    <div className="p-8 min-h-screen">
      <Header 
        pageName="Reports / Analytics"
        profileBackground="bg-gray-100"
        showBorder={false}
      />
      
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Reports / Analytics</h2>
          <p className="text-gray-600">This page is under construction.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;

