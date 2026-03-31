import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from '../auth/AuthProvider';
import { SignUp } from './SignUp';

vi.mock('../auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  missingSupabaseEnvMessage: '',
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('SignUp page', () => {
  it('prevents submit when passwords do not match', async () => {
    const signUp = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Full Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(signUp).not.toHaveBeenCalled();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('submits signup payload when form is valid', async () => {
    const signUp = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Full Name'), 'Test User');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(signUp).toHaveBeenCalledWith('new@example.com', 'password123', 'Test User');
  });
});
