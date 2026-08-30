import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Layout } from './components/Layout.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { Landing } from './pages/Landing.tsx';
import { Login } from './pages/Login.tsx';
import { Signup } from './pages/Signup.tsx';
import { Events } from './pages/Events.tsx';
import { EventDetails } from './pages/EventDetails.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Profile } from './pages/Profile.tsx';
import { Admin } from './pages/Admin.tsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing page - actual entry point now  */}
          <Route 
            path="/"
            element={
              <Layout>
                <Landing/>
              </Layout>
            }
            />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />


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
