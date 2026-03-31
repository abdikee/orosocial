import { createBrowserRouter } from 'react-router';
import { ProtectedOutlet, PublicOnlyOutlet } from './auth/RouteGuards';

export const router = createBrowserRouter([
  {
    Component: PublicOnlyOutlet,
    children: [
      {
        path: '/login',
        lazy: async () => {
          const module = await import('./pages/Login');
          return { Component: module.Login };
        },
      },
      {
        path: '/signup',
        lazy: async () => {
          const module = await import('./pages/SignUp');
          return { Component: module.SignUp };
        },
      },
    ],
  },
  {
    Component: ProtectedOutlet,
    children: [
      {
        path: '/',
        lazy: async () => {
          const module = await import('./pages/Home');
          return { Component: module.Home };
        },
      },
      {
        path: '/search',
        lazy: async () => {
          const module = await import('./pages/Search');
          return { Component: module.Search };
        },
      },
      {
        path: '/profile/:userId',
        lazy: async () => {
          const module = await import('./pages/Profile');
          return { Component: module.Profile };
        },
      },
      {
        path: '/profile/:userId/followers',
        lazy: async () => {
          const module = await import('./pages/Followers');
          return { Component: module.Followers };
        },
      },
      {
        path: '/profile/:userId/following',
        lazy: async () => {
          const module = await import('./pages/Following');
          return { Component: module.Following };
        },
      },
    ],
  },
]);