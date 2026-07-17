const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api';
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api';
};

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'super_admin' | 'staff';
  permissions?: string[];
}

export interface AdminAuthResponse {
  token: string;
  user: AdminUser;
}

class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async login(email: string, password: string): Promise<AdminAuthResponse> {
    const response = await fetch(`${this.baseUrl}/admin/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    }
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    console.log("[AdminApi] POST:", endpoint, "data:", JSON.stringify(data));
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log("[AdminApi] Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || errorData.error || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          message = errorData.message || errorData.error || errorData.exception || message;
        } else {
          const text = await response.text();
          message = text.substring(0, 200) || message;
        }
      } catch {
        // Use default message
      }
      throw new Error(message);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      try {
        const data = await response.json();
        throw new Error(data.error || `HTTP ${response.status}`);
      } catch (e) {
        if (e instanceof Error) throw e;
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
    }

    try {
      return response.json();
    } catch {
      return {} as T;
    }
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || errorData.error || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  getUser(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  }
}

export const adminApi = new AdminApiClient(getBaseUrl());

export interface HomeSection {
  id: number;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  background_image: string | null;
  link: string | null;
  button_text: string | null;
  position: number;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  items?: HomeSectionItem[];
  created_at: string;
  updated_at: string;
}

export interface HomeSectionItem {
  id: number;
  home_section_id: number;
  title: string | null;
  description: string | null;
  image: string | null;
  link: string | null;
  price: number | null;
  sale_price: number | null;
  badge: string | null;
  button_text: string | null;
  position: number;
  product_id: number | null;
  meta: Record<string, unknown> | null;
  product?: {
    id: number;
    name: string;
    slug: string;
    image: string;
    price: number;
  };
}

export const homeSectionApi = {
  getAll: () => adminApi.get<HomeSection[]>('/admin/home-sections'),
  get: (id: number) => adminApi.get<HomeSection>(`/admin/home-sections/${id}`),
  create: (data: Partial<HomeSection>) => adminApi.post<HomeSection>('/admin/home-sections', data),
  update: (id: number, data: Partial<HomeSection>) => adminApi.put<HomeSection>(`/admin/home-sections/${id}`, data),
  delete: (id: number) => adminApi.delete<void>(`/admin/home-sections/${id}`),
  getItems: (sectionId: number) => adminApi.get<HomeSectionItem[]>(`/admin/home-sections/${sectionId}/items`),
  createItem: (sectionId: number, data: Partial<HomeSectionItem>) => 
    adminApi.post<HomeSectionItem>(`/admin/home-sections/${sectionId}/items`, data),
  updateItem: (sectionId: number, itemId: number, data: Partial<HomeSectionItem>) =>
    adminApi.put<HomeSectionItem>(`/admin/home-sections/${sectionId}/items/${itemId}`, data),
  deleteItem: (sectionId: number, itemId: number) =>
    adminApi.delete<void>(`/admin/home-sections/${sectionId}/items/${itemId}`),
};

export const getHomeSections = async (): Promise<HomeSection[]> => {
  const response = await fetch(`${getBaseUrl()}/home-sections`);
  if (!response.ok) throw new Error('Failed to fetch home sections');
  return response.json();
};
