const API_BASE = 'http://localhost:3001/api';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('bytecode_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    if (!endpoint.includes('/auth/login')) {
      localStorage.removeItem('bytecode_token');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API Request Failed');
  }

  return response.json();
};

export const authApi = {
  login: (username, password) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  me: () => apiFetch('/auth/me'),
};

export const agentsApi = {
  list: () => apiFetch('/agents'),
  get: (id) => apiFetch(`/agents/${id}`),
  kill: (id) => apiFetch(`/agents/${id}`, { method: 'DELETE' }),
};

export const tasksApi = {
  create: (agent_id, type, payload) => apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify({ agent_id, type, payload }),
  }),
  list: (agentId) => apiFetch(`/tasks/${agentId}`),
  results: (agentId) => apiFetch(`/tasks/results/${agentId}`),
};

export const payloadsApi = {
  generate: (serverUrl, showGui = false) => apiFetch('/payloads/generate', {
    method: 'POST',
    body: JSON.stringify({ serverUrl, showGui }),
  }),
};
