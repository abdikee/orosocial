import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from './AuthProvider';
import { ProtectedOutlet, PublicOnlyOutlet } from './RouteGuards';

vi.mock('./AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('RouteGuards', () => {
  it('renders protected content when authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1' } as never,
      session: {} as never,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedOutlet />}>
            <Route path="/private" element={<div>Private content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('redirects unauthenticated protected users to login', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedOutlet />}>
            <Route path="/private" element={<div>Private content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects authenticated users away from public-only pages', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user-1' } as never,
      session: {} as never,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route element={<PublicOnlyOutlet />}>
            <Route path="/login" element={<div>Login page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });
});
