const SESSION_KEY = 'dashboard_session_id';

export const getSessionId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_KEY);
  }
  return null;
};

export const setSessionId = (sessionId) => {
  if (sessionId && typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, sessionId);
  }
};

export const clearSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const withSession = (options = {}) => {
  const sessionId = getSessionId();
  return {
    ...options,
    headers: {
      ...options.headers,
      'X-Session-ID': sessionId || ''
    },
    credentials: 'include'
  };
};

export const handleApiResponse = async (response) => {
  // Save session ID from response headers if present
  const sessionId = response.headers.get('X-Session-ID');
  if (sessionId) {
    setSessionId(sessionId);
  }
  
  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401 || response.status === 403) {
      clearSession();
    }
    throw new Error(error || 'Something went wrong');
  }
  
  return response.json();
};

export const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, withSession(options));
  return handleApiResponse(response);
};
