import { setCurrentUser, getCurrentUser } from '../api';

// Mock supabase to avoid attempting real API calls or importing complex native modules
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithOtp: jest.fn()
    }
  }
}));

describe('API Service - User Management', () => {
  beforeEach(() => {
    // Reset user before each test to ensure test isolation
    setCurrentUser(null);
  });

  it('should correctly set the current user', () => {
    const mockUser = { id: 'test-123', email: 'test@example.com', role: 'PATIENT', firstName: 'Test', lastName: 'User' };
    
    // Initial state should be null
    expect(getCurrentUser()).toBeNull();
    
    // Set user and verify
    setCurrentUser(mockUser);
    expect(getCurrentUser()).toEqual(mockUser);
  });

  it('should allow clearing the current user by passing null', () => {
    const mockUser = { id: 'test-456', email: 'clear@example.com', role: 'DOCTOR', firstName: 'Test', lastName: 'Doc' };
    
    setCurrentUser(mockUser);
    expect(getCurrentUser()).toEqual(mockUser);
    
    setCurrentUser(null);
    expect(getCurrentUser()).toBeNull();
  });
});
