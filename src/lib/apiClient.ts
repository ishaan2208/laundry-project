import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const DEFAULT_DEV_BASE_URL = "http://localhost:3000/api/v1";
const DEFAULT_PROD_BASE_URL = "https://api.staysystems.in/api/v1";

/**
 * Resolve the base URL for the external API.
 *
 * Priority:
 * - `NEXT_PUBLIC_API_BASE_URL` (so you can override per-environment)
 * - `DEFAULT_PROD_BASE_URL` in production
 * - `DEFAULT_DEV_BASE_URL` in all other environments
 */
export function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PROD_BASE_URL;
  }

  return DEFAULT_DEV_BASE_URL;
}

/**
 * Shared Axios instance for talking to the external API.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  // you can set other global options here (timeouts, headers, etc.)
  withCredentials: false,
});

/**
 * Thin wrapper to make typing a bit nicer when you want the `data` shape.
 */
export async function apiRequest<T = unknown>(
  config: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.request<T>(config);
  return response.data;
}


