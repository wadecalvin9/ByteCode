import React from 'react';
import { 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  Users, 
  Cpu, 
  Terminal, 
  Globe, 
  Database,
  Layers
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const NavIcon = ({ icon, label, path, isActive, disabled }) => {
  const Icon = icon;
  return (
    <Link
      to={disabled ? '#' : path}
      className={`sidebar-icon-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      title={label}
    >
      <Icon className="w-[18px] h-[18px]" />
      {isActive && <div className="sidebar-active-dot" />}
    </Link>
  );
};

const Sidebar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('bytecode_token');
    localStorage.removeItem('bytecode_user');
    navigate('/login');
  };

  const topNav = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Node Assets', path: '/agents' },
    { icon: Cpu, label: 'Payload Foundry', path: '/payloads' },
    { icon: Terminal, label: 'Task Auditor', path: '/tasks' },
    { icon: Globe, label: 'Network Graph', path: '/network' },
    { icon: Database, label: 'Exfiltrated Data', path: '/data' },
  ];

  const bottomNav = [
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="app-shell">
      {/* Slim Icon Sidebar */}
      <aside className="icon-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Layers className="w-5 h-5 text-white" />
          </div>
        </div>

        <nav className="sidebar-nav">
          {topNav.map((item) => (
            <NavIcon
              key={item.path}
              {...item}
              isActive={
                item.path === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.path)
              }
            />
          ))}
        </nav>

        <div className="sidebar-bottom">
          {bottomNav.map((item) => (
            <NavIcon
              key={item.path}
              {...item}
              isActive={location.pathname === item.path}
            />
          ))}
          <button
            onClick={handleLogout}
            className="sidebar-icon-btn logout"
            title="Logout"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-panel">
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
