import { useState, useCallback, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import StaffSelection from './pages/StaffSelection'
import PinEntry from './pages/PinEntry'
import Sidebar from './components/shared/Sidebar'
import { SidebarContext } from './context/SidebarContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/shared/ProtectedRoute'

import Inventory from './pages/Inventory'
import Terminal from './pages/terminal'
import Transaction from './pages/transaction'
import Settings from './pages/Settings'
import Dashboard from './pages/owner/Dashboard'
import Reports from './pages/owner/Reports'
import ManageEmployees from './pages/owner/ManageEmployees'
import DiscountManagement from './pages/owner/DiscountManagement'
import BrandPartners from './pages/owner/BrandPartners'
import SetNewPin from './pages/SetNewPin'
import OwnerOnboarding from './pages/OwnerOnboarding'

const MainLayout = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <SidebarContext.Provider value={{ isExpanded }}>
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        <main className={`transition-all duration-300 px-6 py-4 ${isExpanded ? 'ml-80' : 'ml-20'}`}>
          {children}
        </main>
      </SidebarContext.Provider>
    </div>
  );
};

const LandingGate = () => {
  const [status, setStatus] = useState({
    loading: true,
    error: '',
    hasAccounts: false
  });

  const checkEmployees = useCallback(async () => {
    setStatus((prev) => ({
      ...prev,
      loading: true,
      error: ''
    }));

    try {
      const response = await fetch('http://localhost:5000/api/employees');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to determine account status.');
      }

      setStatus({
        loading: false,
        error: '',
        hasAccounts: data.count > 0
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error.message || 'Unable to reach the server. Please ensure the backend is running.',
        hasAccounts: false
      });
    }
  }, []);

  useEffect(() => {
    checkEmployees();
  }, [checkEmployees]);

  if (status.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1F1F1F]">
        <p className="text-white tracking-[0.3em] uppercase text-sm">Preparing CYSPOS...</p>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1F1F1F] px-4 text-center gap-6">
        <div className="max-w-md">
          <p className="text-white text-lg font-semibold mb-2">Something went wrong</p>
          <p className="text-gray-400 text-sm">{status.error}</p>
        </div>
        <button
          onClick={checkEmployees}
          className="px-6 py-3 rounded-2xl bg-white text-[#1F1F1F] font-semibold shadow-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status.hasAccounts) {
    return <OwnerOnboarding onSetupComplete={checkEmployees} />;
  }

  return <StaffSelection />;
};

function App() {
  // Disable mouse wheel on number inputs globally
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.target.type === 'number') {
        e.preventDefault();
      }
    };

    // Add event listener to prevent wheel events on number inputs
    document.addEventListener('wheel', handleWheel, { passive: false });

    // Also blur number inputs when they receive wheel events
    const handleNumberInputWheel = (e) => {
      if (document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };

    document.addEventListener('wheel', handleNumberInputWheel);

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('wheel', handleNumberInputWheel);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingGate />} />
          <Route path="/pin" element={<PinEntry />} />
          <Route path="/set-pin" element={
            <ProtectedRoute>
              <SetNewPin />
            </ProtectedRoute>
          } />
          
          {/* Owner-only routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute ownerOnly={true}>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute requiredPermission="generateReports">
              <MainLayout><Reports /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/manage-employees" element={
            <ProtectedRoute ownerOnly={true}>
              <MainLayout><ManageEmployees /></MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Permission-based routes */}
          <Route path="/inventory" element={
            <ProtectedRoute requiredPermission="inventory">
              <MainLayout><Inventory /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/terminal" element={
            <ProtectedRoute requiredPermission="posTerminal">
              <MainLayout><Terminal /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute requiredPermission="viewTransactions">
              <MainLayout><Transaction /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requiredPermission={null}>
              <MainLayout><Settings /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/discount-management" element={
            <ProtectedRoute requiredPermission={null}>
              <MainLayout><DiscountManagement /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/brand-partners" element={
            <ProtectedRoute requiredPermission={null}>
              <MainLayout><BrandPartners /></MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
