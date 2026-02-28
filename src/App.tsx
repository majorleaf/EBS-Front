import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Layout } from './components/Layout.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { Login } from './pages/Login.tsx';
import { Signup } from './pages/Signup.tsx';
import { Events } from './pages/Events.tsx';
import { EventDetails } from './pages/EventDetails.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Admin } from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/"
            element={<Navigate to="/events" replace />}
          />

          <Route
            path="/events"
            element={
              <Layout>
                <Events />
              </Layout>
            }
          />

          <Route
            path="/events/:id"
            element={
              <Layout>
                <EventDetails />
              </Layout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
