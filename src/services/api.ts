// NavbatUz API Service - connects React Native frontend to NestJS backend
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine, iOS simulator uses localhost
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

let authToken: string | null = null;
let currentUser: any = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setCurrentUser(user: any) {
  currentUser = user;
}

export function getCurrentUser() {
  return currentUser;
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorBody.message || `API Error: ${response.status}`);
  }

  return response.json();
}

// ─── Auth ──────────────────────────────────────────────
export async function login(email: string, password: string) {
  const data = await apiRequest('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.access_token);
  setCurrentUser(data.user);
  return data;
}

export async function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return apiRequest('auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getProfile() {
  return apiRequest('auth/profile');
}

// ─── Doctors ───────────────────────────────────────────
export async function getDoctors(specialty?: string) {
  const query = specialty && specialty !== 'All' ? `?specialty=${encodeURIComponent(specialty)}` : '';
  return apiRequest(`doctors${query}`);
}

export async function getDoctor(id: number) {
  return apiRequest(`doctors/${id}`);
}

// ─── Appointments ──────────────────────────────────────
export async function getAppointments() {
  return apiRequest('appointments');
}

export async function createAppointment(data: {
  doctorId: number;
  dateTime: string;
  type?: string;
  notes?: string;
}) {
  return apiRequest('appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Medical Records ───────────────────────────────────
export async function getRecords() {
  return apiRequest('records');
}

// ─── Reviews ───────────────────────────────────────────
export async function getReviews(doctorId: number) {
  return apiRequest(`reviews?doctorId=${doctorId}`);
}

export async function createReview(data: {
  doctorId: number;
  rating: number;
  comment?: string;
}) {
  return apiRequest('reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Notifications ─────────────────────────────────────
export async function getNotifications() {
  return apiRequest('notifications');
}

export async function markNotificationRead(id: number) {
  return apiRequest(`notifications/${id}/read`, { method: 'PATCH' });
}

export default {
  login,
  register,
  getProfile,
  getDoctors,
  getDoctor,
  getAppointments,
  createAppointment,
  getRecords,
  getReviews,
  createReview,
  getNotifications,
  markNotificationRead,
  setAuthToken,
  getAuthToken,
  setCurrentUser,
  getCurrentUser,
};
