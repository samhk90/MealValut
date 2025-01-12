import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate,useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from './components/SupabaseClient';
import { setUser, clearUser } from './redux/features/authSlice';
import Login from './components/Login';
import SignUp from './components/Signup';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import Table from './components/Table';
import Menu from './components/Menu';
import Takeaway from './components/Takeaway';
import Orders from './components/Orders';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  return user ? children : (
    <Navigate 
      to="/login" 
      state={{ from: location.pathname }}
      replace
    />);
};
function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check for existing session
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        dispatch(setUser(session.user));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        dispatch(setUser(session.user));
        // navigate('table');
      } else if (event === 'SIGNED_OUT') {
        dispatch(clearUser());
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />

      {/* Protected Routes */}
      <Route path='/' element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="table" element={<Table />} />
        <Route path="takeaway" element={<Takeaway />} />
        <Route path="settings" element={<Settings />} />
        <Route path="menu" element={<Menu />} />
        <Route path="orders" element={<Orders />} />
        {/* Add other protected routes here */}
      </Route>

      {/* Catch all route */}

    </Routes>
  );
}

export default App;
