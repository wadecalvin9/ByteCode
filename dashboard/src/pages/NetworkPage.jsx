import React, { useEffect, useState, useMemo } from 'react';
import { 
  Globe, 
  Server, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Shield, 
  Zap,
  Maximize2,
  RefreshCw,
  Search
} from 'lucide-react';
import { agentsApi } from '../utils/api';
import { Link } from 'react-router-dom';

const NetworkNode = ({ agent, x, y, isCenter }) => {
  const isOnline = agent.connection_status === 'online';
  
  return (
    <div 
      className={`network-node-wrapper ${isCenter ? 'center' : ''}`}
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <Link 
        to={isCenter ? '#' : `/agents/${agent.id}`}
        className={`network-node ${isCenter ? 'server' : isOnline ? 'online' : 'offline'}`}
      >
        {isCenter ? (
          <Server className="w-6 h-6 text-white" />
        ) : (
          <Monitor className="w-4 h-4" />
        )}
        
        {!isCenter && (
          <div className="node-info-popup">
            <div className="font-bold">{agent.hostname}</div>
            <div className="text-[10px] opacity-70">{agent.ip_address}</div>
            <div className={`text-[10px] ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
              {isOnline ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
          </div>
        )}
      </Link>
      <div className="node-label">
        {isCenter ? 'ByteCode C2' : agent.hostname}
      </div>
    </div>
  );
};

const ConnectionLine = ({ x1, y1, x2, y2, isOnline }) => {
  const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

  return (
    <div 
      className={`connection-line ${isOnline ? 'online' : 'offline'}`}
      style={{
        left: `${x1}%`,
        top: `${y1}%`,
        width: `${length}%`,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 0'
      }}
    >
      {isOnline && <div className="data-pulse" />}
    </div>
  );
};

const NetworkPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAgents = async () => {
    try {
      const data = await agentsApi.list();
      setAgents(data.agents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredAgents = agents.filter(a => 
    a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ip_address?.includes(searchQuery)
  );

  const nodePositions = useMemo(() => {
    const positions = [];
    const radius = 35; // %
    const centerX = 50;
    const centerY = 50;
    
    filteredAgents.forEach((agent, i) => {
      const angle = (i / filteredAgents.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.push({ ...agent, x, y });
    });
    
    return positions;
  }, [filteredAgents]);

  return (
    <div className="dashboard scroll-area">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Network Graph</h1>
          <p className="dash-subtitle">Topology of the active infiltration web</p>
        </div>
        <div className="dash-header-actions">
          <div className="dash-search">
            <Search className="dash-search-icon" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dash-search-input"
            />
          </div>
          <button className="dash-notif-btn ml-2" title="Auto-layout">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <section className="network-map-container mt-6">
        <div className="network-canvas">
          {/* Background Grid */}
          <div className="network-grid" />
          
          {/* Connection Lines */}
          {nodePositions.map(node => (
            <ConnectionLine 
              key={`line-${node.id}`}
              x1={50} y1={50} 
              x2={node.x} y2={node.y}
              isOnline={node.connection_status === 'online'}
            />
          ))}

          {/* Central C2 Hub */}
          <NetworkNode 
            agent={{ hostname: 'ByteCode Server', connection_status: 'online' }} 
            x={50} y={50} 
            isCenter={true} 
          />

          {/* Agent Nodes */}
          {nodePositions.map(node => (
            <NetworkNode 
              key={node.id} 
              agent={node} 
              x={node.x} 
              y={node.y} 
            />
          ))}

          {loading && agents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {agents.length === 0 && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Globe className="w-16 h-16 mb-4 opacity-20" />
              <p>No active connections in the mesh</p>
            </div>
          )}
        </div>

        <div className="network-stats-overlay">
          <div className="net-stat">
            <div className="net-stat-label">Total Nodes</div>
            <div className="net-stat-value">{agents.length}</div>
          </div>
          <div className="net-stat">
            <div className="net-stat-label">Online</div>
            <div className="net-stat-value text-green-400">
              {agents.filter(a => a.connection_status === 'online').length}
            </div>
          </div>
          <div className="net-stat">
            <div className="net-stat-label">Encryption</div>
            <div className="net-stat-value text-blue-400">AES-256</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NetworkPage;
