const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export function setAuthHeaders(token?: string): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const requestHeaders = new Headers(options.headers);
  requestHeaders.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: requestHeaders,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string" ? data : data?.message ?? "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function apiFetchMultipart(
  path: string,
  formData: FormData,
  options: RequestInit = {},
) {
  const requestHeaders = new Headers(options.headers);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body: formData,
    headers: requestHeaders,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string" ? data : data?.message ?? "Request failed";
    throw new Error(message);
  }

  return data;
}