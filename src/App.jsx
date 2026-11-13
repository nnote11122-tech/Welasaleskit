import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import ProjectDetail from './pages/ProjectDetail';
import Gallery from './pages/Gallery';
import FloorPlan from './pages/FloorPlan';
import RoomSelection from './pages/RoomSelection'; 
import RoomPlan from './pages/RoomPlan';
import Location from './pages/Location';
import Quotation from './pages/Quotation';
import UnitMatrix from './pages/UnitMatrix';
import Booking from "./pages/Booking";

// --- LoginScreen: ปรับ UI ให้เข้ากับ WELA CI ---
function LoginScreen({ onLogin, correctPass = '8888', title = "ASAKAN DEVELOPMENT", subtitle = "WELA", label = "ENTER PASSCODE" }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  
  const welaRed = '#E14D43';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass === correctPass) { 
      onLogin(); 
    } else { 
      setError(true); 
      setPass(''); 
    }
  };

  return (
    <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6 text-white font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-red-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-sm text-center relative z-10">
        <div className="mb-12">
          <span className="text-[10px] tracking-[0.8em] uppercase text-white/40 font-bold block mb-3">{title}</span>
          <h1 className="text-5xl font-black tracking-tighter text-white italic uppercase">
            WE<span style={{ color: welaRed }}>L</span>A
          </h1>
          <div className="w-8 h-[2px] mx-auto mt-4" style={{ backgroundColor: welaRed }}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <p className="text-[10px] text-white/30 font-bold tracking-[0.3em] uppercase">{label}</p>
            <input
              type="password" 
              inputMode="numeric" 
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(false); }}
              placeholder="••••"
              className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} rounded-2xl py-6 px-8 text-center text-3xl tracking-[0.6em] focus:outline-none focus:border-red-500 transition-all placeholder:text-sm placeholder:opacity-20`}
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-6 rounded-2xl font-black tracking-[0.4em] uppercase transition-all shadow-2xl active:scale-95"
            style={{ backgroundColor: welaRed }}
          >
            Access System
          </button>
        </form>
      </div>
    </div>
  );
}

// --- QuotationGuard: redirect ไป /login ถ้ายังไม่ login ---
function QuotationGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-[#001a33]" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  return children;
}

// --- Main App Component ---
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAsakanAuth');
    const loginTime = localStorage.getItem('asakanLoginTime');
    
    if (authStatus === 'true' && loginTime) {
      const now = new Date().getTime();
      const savedTime = parseInt(loginTime);
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (!isNaN(savedTime) && (now - savedTime < twentyFourHours)) {
        setIsAuthenticated(true);
      } else {
        localStorage.clear();
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    const now = new Date().getTime();
    setIsAuthenticated(true);
    localStorage.setItem('isAsakanAuth', 'true');
    localStorage.setItem('asakanLoginTime', now.toString());
  };

  if (loading) return <div className="min-h-screen bg-[#001a33]" />;
  
  // ชั้นที่ 1: ตรวจสอบสิทธิ์เข้าแอปหลัก (รหัส 8888)
  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} correctPass="8888" />;

  return (
    <AuthProvider>
    <Router>
      <div className="min-h-screen bg-[#001a33]">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/project/:id/gallery" element={<Gallery />} />
          <Route path="/project/:id/floor-plan" element={<FloorPlan />} />
          <Route path="/project/:id/location" element={<Location />} />
          
          <Route path="/project/:id/room-plan" element={<RoomSelection />} />
          <Route path="/project/:id/room-perspective" element={<RoomSelection />} />
          <Route path="/project/:id/room-details" element={<RoomPlan />} />

          {/* ด่านความปลอดภัยชั้นที่ 2 สำหรับ Matrix, Quotation, Booking */}
          <Route 
            path="/project/:id/matrix" 
            element={
              <QuotationGuard>
                <UnitMatrix />
              </QuotationGuard>
            } 
          />
          
          <Route 
            path="/project/:id/quotation" 
            element={
              <QuotationGuard>
                <Quotation />
              </QuotationGuard>
            } 
          />
          
          <Route 
            path="/project/:id/booking" 
            element={
              <QuotationGuard>
                <Booking />
              </QuotationGuard>
            } 
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
    </AuthProvider>
  );
}

export default App;