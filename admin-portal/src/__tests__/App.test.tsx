import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  SUPABASE_URL: 'mock-url',
  SUPABASE_ANON_KEY: 'mock-key'
}));

describe('App Login Screen', () => {
  it('renders ClinicUz Portal header', async () => {
    render(<App />);
    expect(await screen.findByText('ClinicUz Portal')).toBeInTheDocument();
  });

  it('toggles between Admin and Doctors login modes', async () => {
    render(<App />);
    
    // InitiallyOTP/Admin mode (Wait for loading to finish)
    expect(await screen.findByText('Send Verification Code')).toBeInTheDocument();
    
    // Switch to Doctors mode
    const doctorsBtn = await screen.findByText('Doctors Login');
    fireEvent.click(doctorsBtn);
    
    // Password input should appear
    expect(await screen.findByText('Sign In')).toBeInTheDocument();
  });
});
