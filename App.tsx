
import React, { useContext } from 'react';
import { AppContext } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import RoomStatusPage from './pages/RoomStatusPage';
import DashboardPage from './pages/DashboardPage';
import CleaningPage from './pages/CleaningPage';
import ReceiptPage from './pages/ReceiptPage';

const App: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  const { isAuthenticated, activePage, isLoading } = context;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  const renderPage = () => {
    switch(activePage) {
      case 'home':
        return <HomePage />;
      case 'room_status':
        return <RoomStatusPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'cleaning':
        return <CleaningPage />;
      case 'receipt':
        return <ReceiptPage />;
      default:
        return <HomePage />;
    }
  }

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

export default App;