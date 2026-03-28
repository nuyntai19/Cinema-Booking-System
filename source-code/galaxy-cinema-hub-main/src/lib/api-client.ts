/**
 * Base API Client with authentication and error handling
 */

import { API_BASE_URL, STORAGE_KEYS } from "./api-config";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errors?: Record<string, string>,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseURL: string;
  private hasHandledUnauthorized = false;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    return (
      localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
      localStorage.getItem("token")
    );
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem("token", token);
    this.hasHandledUnauthorized = false;
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem("token");
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem("user");
  }

  private handleUnauthorized(): void {
    if (this.hasHandledUnauthorized) return;
    this.hasHandledUnauthorized = true;

    this.clearAuthToken();
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }

  /**
   * Build headers for request
   */
  private buildHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let data: any;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new ApiError(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          response.status,
          data?.errors,
          data,
        );
      }

      throw new ApiError(
        data?.message || "An error occurred",
        response.status,
        data?.errors,
        data,
      );
    }

    return data;
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: this.buildHeaders(options?.headers),
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Network error", 0);
    }
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: this.buildHeaders(options?.headers),
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Network error", 0);
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers: this.buildHeaders(options?.headers),
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Network error", 0);
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "DELETE",
        headers: this.buildHeaders(options?.headers),
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Network error", 0);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
