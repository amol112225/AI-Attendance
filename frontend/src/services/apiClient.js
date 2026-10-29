/**
 * AttendAI API Client Service
 *
 * Lightweight Fetch wrapper for communicating with the FastAPI backend.
 * Prepared for future milestone integration. Does not perform actual network requests in Milestone 1.
 */

import { config } from '../utils/config';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Internal request handler with standard error handling and headers.
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Future enhancement: attach Supabase session JWT when available
    // const token = getAuthToken();
    // if (token) headers['Authorization'] = `Bearer ${token}`;

    const requestConfig = {
      ...options,
      headers,
    };

    const response = await fetch(url, requestConfig);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(config.apiBaseUrl);
export default apiClient;
