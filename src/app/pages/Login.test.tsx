import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from '../auth/AuthProvider';
import { Login } from './Login';

vi.mock('../auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  missingSupabaseEnvMessage: '',
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('Login page', () => {
  it('submits email and password through auth provider', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('shows error message when sign in fails', async () => {
    const signIn = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    mockedUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
