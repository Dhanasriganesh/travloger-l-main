interface FetchOptions extends RequestInit {
  handleError?: boolean;
}

export async function fetchApi<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const {
    headers = {},
    handleError = true,
    ...rest
  } = options;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      ...rest,
    });

    const data = await response.json();

    if (!response.ok) {
      // If the response has an error message, use it
      const error = new Error(data.error || 'API request failed');
      error.name = 'ApiError';
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (handleError) {
      console.error(`API Error (${url}):`, error);
      // Re-throw the error to be handled by the component
      throw error;
    }
    throw error;
  }
}

export function handleApiError(error: any): string {
  if (error.name === 'ApiError') {
    return error.data?.error || error.message || 'API request failed';
  }
  return error.message || 'An unexpected error occurred';
}

