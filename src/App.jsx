import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import ChatLayout from './pages/ChatLayout';
import ProfilePage from './pages/ProfilePage';
import DiscoveryPage from './pages/DiscoveryPage';
import BlockListPage from './pages/BlockListPage';
import PublicProfilePage from './pages/PublicProfilePage';
import FriendRequestsPage from './pages/FriendRequestsPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        {/* CHANGE THIS for loading spinner color */}
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PostSignupOverlay() {
  const { isNewUser, clearNewUser } = useAuth();
  const navigate = useNavigate();

  if (!isNewUser) return null;

  function handleComplete() {
    clearNewUser();
    navigate('/discover');
  }

  function handleSkip() {
    clearNewUser();
    navigate('/discover');
  }

  return <ProfileSetupModal onComplete={handleComplete} onSkip={handleSkip} />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <DiscoveryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blocked"
          element={
            <ProtectedRoute>
              <BlockListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/:userId"
          element={
            <ProtectedRoute>
              <PublicProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <FriendRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
      {/* Post-signup overlay — renders on top of any route */}
      {user && <PostSignupOverlay />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
