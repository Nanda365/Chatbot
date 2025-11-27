const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || data.error || 'An error occurred',
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async register(name: string, email: string, password: string) {
    return this.request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request<any>('/api/auth/me');
  }

  // Chat endpoints
  async sendMessage(message: string, conversationId?: string, model?: string) {
    return this.request<{ conversationId: string; response: string; messageId: string }>('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId, model }),
    });
  }

  async getChatHistory(page: number = 1, limit: number = 20) {
    return this.request<{ conversations: any[]; total: number; page: number }>(
      `/api/chat/history?page=${page}&limit=${limit}`
    );
  }

  async getConversation(id: string) {
    return this.request<{ messages: any[] }>(`/api/chat/history/${id}`);
  }

  async searchConversations(query: string) {
    return this.request<{ conversations: any[] }>(
      `/api/chat/history/search?q=${encodeURIComponent(query)}`
    );
  }

  // Admin endpoints
  async addFaq(data: { question: string; answer: string; tags?: string[] }) {
    return this.request('/api/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
