import Header from '../../components/shared/header';
import { useAuth } from '../../context/AuthContext';
import dashboardImg from '../../assets/owner/temp/dashboard.png';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const userName = currentUser?.name || 'Owner';
  const userRole = 'Owner';

  return (
    <div className="p-8 min-h-screen">
      <Header 
        pageName="Dashboard"
        profileBackground="bg-gray-100"
        showBorder={false}
        userName={userName}
        userRole={userRole}
      />
      
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <img 
            src={dashboardImg} 
            alt="Dashboard" 
            className="w-full h-auto"
            style={{
              imageRendering: 'auto',
              WebkitImageRendering: '-webkit-optimize-contrast',
              objectFit: 'contain',
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              backfaceVisibility: 'hidden',
              transform: 'translateZ(0)'
            }}
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

