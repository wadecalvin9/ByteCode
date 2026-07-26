import React from 'react';
import {
  LayoutDashboard,
  Settings,
  Users,
  Cpu,
  Terminal,
  Globe,
  Database,
  LogOut,
  Layers,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon, label, path, isActive, disabled }) => {
  const Icon = icon;
  return (
    <Link
      to={disabled ? '#' : path}
      className={`sidebar-icon-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      title={label}
    >
      <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
      <span className="sidebar-icon-label">{label}</span>
    </Link>
  );
};

const Sidebar = ({ children }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const operatorRaw = localStorage.getItem('bytecode_user');
  const operator = operatorRaw ? JSON.parse(operatorRaw) : null;
  const username  = operator?.username || 'operator';
  const initials  = username.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('bytecode_token');
    localStorage.removeItem('bytecode_user');
    navigate('/login');
  };

  const topNav = [
    { icon: LayoutDashboard, label: 'Overview',        path: '/'        },
    { icon: Users,           label: 'Endpoints',       path: '/agents'  },
    { icon: Cpu,             label: 'Payload Builder', path: '/payloads'},
    { icon: Terminal,        label: 'Task Manager',    path: '/tasks'   },
    { icon: Globe,           label: 'Network Map',     path: '/network' },
    { icon: Database,        label: 'Data Explorer',   path: '/data'    },
  ];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="icon-sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Layers size={14} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div className="sidebar-logo-text">ByteCode</div>
            <div className="sidebar-logo-sub">C2 Platform</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          <nav className="sidebar-nav">
            {topNav.map((item) => (
              <NavItem
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

          <div className="sidebar-section-label" style={{ marginTop: 20 }}>System</div>
          <nav className="sidebar-nav">
            <NavItem
              icon={Settings}
              label="Settings"
              path="/settings"
              isActive={location.pathname === '/settings'}
            />
          </nav>
        </div>

        {/* Operator Footer */}
        <div className="sidebar-bottom">
          <div className="sidebar-operator">
            <div className="sidebar-operator-avatar">{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="sidebar-operator-name">{username}</div>
              <div className="sidebar-operator-role">Operator</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-icon-btn logout"
            title="Logout"
            style={{ marginTop: 2 }}
          >
            <LogOut size={14} strokeWidth={1.8} />
            <span className="sidebar-icon-label">Sign out</span>
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
