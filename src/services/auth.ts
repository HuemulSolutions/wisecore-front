import { backendUrl } from '@/config';
import { httpClient } from '@/lib/http-client';
import type { User } from '@/contexts/auth-context';

export interface RequestCodeRequest {
  email: string;
  purpose: 'signup' | 'login';
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface CreateUserRequest {
  name: string;
  last_name: string;
  email: string;
  code: string;
}

export interface UpdateUserRequest {
  name: string;
  last_name: string;
  birthdate?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private baseUrl = `${backendUrl}/auth`;

  async requestCode(request: RequestCodeRequest): Promise<void> {
    console.log('AuthService: Requesting code to', `${this.baseUrl}/codes`, 'with purpose:', request.purpose);
    
    // Make request without auth token for public endpoint
    const response = await fetch(`${this.baseUrl}/codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: request.email.toLowerCase(),
        purpose: request.purpose,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to request verification code');
    }
  }

  async verifyCode(request: VerifyCodeRequest): Promise<AuthResponse> {
    console.log('AuthService: Verifying code to', `${this.baseUrl}/codes/verify`, 'with data:', { 
      email: request.email.toLowerCase(), 
      code: request.code 
    });
    
    // Make request without auth token for public endpoint
    const response = await fetch(`${this.baseUrl}/codes/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: request.email.toLowerCase(),
        code: request.code,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to verify code');
    }

    const responseData = await response.json();
    console.log('Raw verifyCode response:', responseData);
    
    // Verificar si la respuesta tiene la estructura esperada
    if (!responseData.data || !responseData.data.token || !responseData.data.user) {
      console.error('Invalid response structure:', responseData);
      throw new Error('Invalid response from server');
    }
    
    return {
      token: responseData.data.token,
      user: responseData.data.user
    };
  }

  async createUser(request: CreateUserRequest): Promise<AuthResponse> {
    console.log('AuthService: Creating user to', `${this.baseUrl}/users`, 'with data:', { 
      name: request.name, 
      last_name: request.last_name,
      email: request.email.toLowerCase(), 
      code: request.code 
    });
    
    // Make request without auth token for public endpoint
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: request.name,
        last_name: request.last_name,
        email: request.email.toLowerCase(),
        code: request.code,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create user');
    }

    const responseData = await response.json();
    console.log('Raw createUser response:', responseData);
    
    // Verificar si la respuesta tiene la estructura esperada
    if (!responseData.data || !responseData.data.token || !responseData.data.user) {
      console.error('Invalid response structure:', responseData);
      throw new Error('Invalid response from server');
    }
    
    return {
      token: responseData.data.token,
      user: responseData.data.user
    };
  }

  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    console.log('AuthService: Updating user', userId, 'with data:', request);
    
    const response = await httpClient.put(`${backendUrl}/users/${userId}`, request);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update user');
    }

    const responseData = await response.json();
    console.log('Raw updateUser response:', responseData);
    
    // Return the updated user data
    return responseData.data || responseData;
  }
}

export const authService = new AuthService();