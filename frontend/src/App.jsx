import { useState, useCallback, useEffect, lazy, Suspense, memo } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import Sidebar from './components/shared/Sidebar'
import { SidebarContext } from './context/SidebarContext'
import { AuthProvider } from './context/AuthContext'
import { DataCacheProvider } from './context/DataCacheContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ProtectedRoute from './components/shared/ProtectedRoute'
import PageTitle from './components/shared/PageTitle'

// Lazy load all pages for better performance
const StaffSelection = lazy(() => import('./pages/StaffSelection'))
const PinEntry = lazy(() => import('./pages/PinEntry'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Logs = lazy(() => import('./pages/logs'))
const Terminal = lazy(() => import('./pages/terminal'))
const Transaction = lazy(() => import('./pages/transaction'))
const Settings = lazy(() => import('./pages/Settings'))
const Dashboard = lazy(() => import('./pages/owner/Dashboard'))
const Reports = lazy(() => import('./pages/owner/Reports'))
const ManageEmployees = lazy(() => import('./pages/owner/ManageEmployees'))
const DiscountManagement = lazy(() => import('./pages/owner/DiscountManagement'))
const BrandPartners = lazy(() => import('./pages/owner/BrandPartners'))
const Categories = lazy(() => import('./pages/owner/Categories'))
const SetNewPin = lazy(() => import('./pages/SetNewPin'))
const OwnerOnboarding = lazy(() => import('./pages/OwnerOnboarding'))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B7355] mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

const MainLayout = memo(({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme === 'dark' ? '#1E1B18' : '#F5F5F5' }}>
      <SidebarContext.Provider value={{ isExpanded }}>
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        <main className={`transition-all duration-300 px-6 py-4 ${isExpanded ? 'ml-80' : 'ml-20'}`}>
          {children}
        </main>
      </SidebarContext.Provider>
    </div>
  );
});

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
    return (
      <Suspense fallback={<PageLoader />}>
        <OwnerOnboarding onSetupComplete={checkEmployees} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <PinEntry />
    </Suspense>
  );
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
    <ThemeProvider>
      <AuthProvider>
        <DataCacheProvider>
          <Router>
            <Toaster position="top-center" reverseOrder={false} />
            <PageTitle />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingGate />} />
                <Route path="/pin" element={
                  <Suspense fallback={<PageLoader />}>
                    <PinEntry />
                  </Suspense>
                } />
                <Route path="/staff" element={
                  <Suspense fallback={<PageLoader />}>
                    <StaffSelection />
                  </Suspense>
                } />
                <Route path="/set-pin" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <SetNewPin />
                    </Suspense>
                  </ProtectedRoute>
                } />

                {/* Owner-only routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute ownerOnly={true}>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Dashboard />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute requiredPermission="generateReports">
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Reports />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/manage-employees" element={
                  <ProtectedRoute ownerOnly={true}>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <ManageEmployees />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />

                {/* Permission-based routes */}
                <Route path="/inventory" element={
                  <ProtectedRoute requiredPermission="inventory">
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Inventory />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/stock-movement" element={
                  <ProtectedRoute requiredPermission="inventory">
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Logs />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/terminal" element={
                  <ProtectedRoute requiredPermission="posTerminal">
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Terminal />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/transactions" element={
                  <ProtectedRoute requiredPermission="viewTransactions">
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Transaction />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute requiredPermission={null}>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Settings />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/discount-management" element={
                  <ProtectedRoute requiredPermission={null}>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <DiscountManagement />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/brand-partners" element={
                  <ProtectedRoute requiredPermission={null}>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <BrandPartners />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={
                  <ProtectedRoute requiredPermission={null}>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Categories />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </Router>
        </DataCacheProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
