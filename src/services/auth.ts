import { backendUrl } from '@/config';
import { httpClient } from '@/lib/http-client';
import { logger } from '@/lib/logger';
import type { User } from '@/types';
import type { RequestCodeRequest, VerifyCodeRequest, UpdateUserRequest, AuthResponse } from '@/types/auth';

export type { RequestCodeRequest, VerifyCodeRequest, UpdateUserRequest, AuthResponse };

class AuthService {
  private baseUrl = `${backendUrl}/auth`;

  async requestCode(request: RequestCodeRequest): Promise<void> {
    logger.log('AuthService: Requesting code to', `${this.baseUrl}/codes`, 'with purpose:', request.purpose);
    
    // Make request without auth token for public endpoint
    await httpClient.post(`${this.baseUrl}/codes`, {
      email: request.email.toLowerCase(),
      purpose: request.purpose,
    });
  }

  async verifyCode(request: VerifyCodeRequest): Promise<AuthResponse> {
    logger.log('AuthService: Verifying code to', `${this.baseUrl}/codes/verify`, 'for email:', request.email.toLowerCase());

    // Make request without auth token for public endpoint
    const response = await httpClient.post(`${this.baseUrl}/codes/verify`, {
      email: request.email.toLowerCase(),
      code: request.code,
    });

    const responseData = await response.json();
    logger.log('Raw verifyCode response, token present:', !!responseData?.data?.token);

    // Verificar si la respuesta tiene la estructura esperada
    if (!responseData.data || !responseData.data.token || !responseData.data.user) {
      logger.error('Invalid response structure:', responseData);
      throw new Error('Invalid response from server');
    }

    return {
      token: responseData.data.token,
      user: responseData.data.user
    };
  }

  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    logger.log('AuthService: Updating user', userId, 'with data:', request);
    
    const response = await httpClient.put(`${backendUrl}/users/${userId}`, request);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update user');
    }

    const responseData = await response.json();
    logger.log('Raw updateUser response:', responseData);
    
    // Return the updated user data
    return responseData.data || responseData;
  }
}

export const authService = new AuthService();
