import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { agentsApi, tasksApi } from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [events, setEvents] = useState([]);
  const [lastAgentCount, setLastAgentCount] = useState(0);

  const addToast = useCallback((title, type = 'info', description = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, type, description }]);
    
    // Also add to persistent event log
    setEvents(prev => [{
      id,
      title,
      type,
      description,
      timestamp: new Date(),
    }, ...prev].slice(0, 50)); // Keep last 50 events

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Background monitoring for global events
  useEffect(() => {
    const monitorEvents = async () => {
      try {
        const data = await agentsApi.list();
        const currentAgents = data.agents || [];
        
        // 1. Detect New Agents
        if (lastAgentCount > 0 && currentAgents.length > lastAgentCount) {
          const newAgent = currentAgents[0]; // Assuming newest is first or just notifying of count change
          addToast('New Node Detected', 'success', `Asset ${newAgent.hostname} has established a link.`);
        }
        setLastAgentCount(currentAgents.length);

        // 2. Detect Critical Network States (if any)
        // This would require a global results scan, but we'll start with agent check-ins
      } catch (err) {
        console.error('Event monitoring failed:', err);
      }
    };

    const interval = setInterval(monitorEvents, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [lastAgentCount, addToast]);

  return (
    <NotificationContext.Provider value={{ toasts, events, addToast }}>
      {children}
      
      {/* Global Toast Overlay */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto min-w-[320px] p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transform transition-all duration-500 flex flex-col gap-1 ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-sky-500/10 border-sky-500/20 text-sky-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">{toast.title}</span>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                toast.type === 'success' ? 'bg-emerald-400' :
                toast.type === 'error' ? 'bg-red-400' :
                toast.type === 'warning' ? 'bg-amber-400' :
                'bg-sky-400'
              }`} />
            </div>
            {toast.description && (
              <p className="text-[10px] opacity-70 font-bold">{toast.description}</p>
            )}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
