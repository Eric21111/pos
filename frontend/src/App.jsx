import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import StaffSelection from './pages/StaffSelection'
import PinEntry from './pages/PinEntry'
import Sidebar from './components/shared/Sidebar'
import { SidebarContext } from './context/SidebarContext'
import { AuthProvider } from './context/AuthContext'

import Inventory from './pages/Inventory'
import Terminal from './pages/terminal'
import Transaction from './pages/transaction'
import Settings from './pages/Settings'
import Dashboard from './pages/owner/Dashboard'
import Reports from './pages/owner/Reports'
import ManageEmployees from './pages/owner/ManageEmployees'

// Layout wrapper component for pages that need sidebar
const MainLayout = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <SidebarContext.Provider value={{ isExpanded }}>
        <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        <main className={`transition-all duration-300 ${isExpanded ? 'ml-80' : 'ml-20'}`}>
          {children}
        </main>
      </SidebarContext.Provider>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth pages without sidebar */}
          <Route path="/" element={<StaffSelection />} />
          <Route path="/pin" element={<PinEntry />} />
          
          {/* Main app pages with sidebar */}
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/reports" element={<MainLayout><Reports /></MainLayout>} />
          <Route path="/manage-employees" element={<MainLayout><ManageEmployees /></MainLayout>} />
          <Route path="/inventory" element={<MainLayout><Inventory /></MainLayout>} />
          <Route path="/terminal" element={<MainLayout><Terminal /></MainLayout>} />
          <Route path="/transactions" element={<MainLayout><Transaction /></MainLayout>} />
          <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
