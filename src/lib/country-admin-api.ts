const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`;

export function handleUnauthorized(response: Response): boolean {
  if (response.status === 401) {
    localStorage.removeItem("country_admin_token");
    localStorage.removeItem("country_admin_user");
    window.location.href = "/countryadmin/login";
    return true;
  }
  return false;
}

export async function countryAdminFetch(endpoint: string, init?: RequestInit) {
  const token = localStorage.getItem("country_admin_token");
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (handleUnauthorized(response)) {
    return null;
  }

  return response;
}
