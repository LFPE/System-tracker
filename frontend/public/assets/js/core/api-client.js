class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function createApiClient(basePath = '/api') {
  async function request(method, path, body) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(basePath + path, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new ApiError(data.error || `Erro ${response.status}`, response.status, data);

      if (response.status === 401 && path !== '/auth/login') {
        window.dispatchEvent(new CustomEvent('tracker:unauthorized', { detail: error }));
      }

      throw error;
    }

    return data;
  }

  return {
    request,
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    del: (path) => request('DELETE', path),
  };
}

export { ApiError };