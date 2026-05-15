import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Resumes from './pages/Resumes.jsx';
import Analyze from './pages/Analyze.jsx';
import Applications from './pages/Applications.jsx';
import ApplicationDetail from './pages/ApplicationDetail.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span>💼</span> JobAssist AI
          </div>
          <nav>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              🏠 Dashboard
            </NavLink>
            <NavLink to="/resumes" className={({ isActive }) => isActive ? 'active' : ''}>
              📄 Resumes
            </NavLink>
            <NavLink to="/analyze" className={({ isActive }) => isActive ? 'active' : ''}>
              🔍 Analyze Job
            </NavLink>
            <NavLink to="/applications" className={({ isActive }) => isActive ? 'active' : ''}>
              📋 Applications
            </NavLink>
          </nav>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/"                 element={<Home />} />
            <Route path="/resumes"          element={<Resumes />} />
            <Route path="/analyze"          element={<Analyze />} />
            <Route path="/applications"     element={<Applications />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
