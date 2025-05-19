const API_BASE_URL = 'http://localhost:5000/api'; 

// Generic function to make API calls
export const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  data: any = null,
  token: string | null = null,
  requiresAuth: boolean = true // Flag to indicate if token is needed
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (requiresAuth && !token) {
    throw new Error('Authentication required.');
  }

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      if ((response.status === 401 || response.status === 403) && requiresAuth) {
        console.error('Authentication failed. Token might be invalid or expired.');
      }
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};

  } catch (error: any) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
};

// Helper functions for specific request types
export const apiGet = (endpoint: string, token: string | null = null, requiresAuth: boolean = true) =>
  apiRequest(endpoint, 'GET', null, token, requiresAuth);

export const apiPost = (endpoint: string, data: any, token: string | null = null, requiresAuth: boolean = true) =>
  apiRequest(endpoint, 'POST', data, token, requiresAuth);

export const apiPut = (endpoint: string, data: any, token: string | null = null, requiresAuth: boolean = true) =>
  apiRequest(endpoint, 'PUT', data, token, requiresAuth);

export const apiDelete = (endpoint: string, token: string | null = null, requiresAuth: boolean = true) =>
  apiRequest(endpoint, 'DELETE', null, token, requiresAuth);
