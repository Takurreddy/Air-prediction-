import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

jest.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    getToken: jest.fn().mockResolvedValue(null),
    signOut: jest.fn(),
  }),
  useUser: () => ({ user: null }),
  SignedIn: ({ children }) => children,
  SignedOut: () => null,
  RedirectToSignIn: () => null,
}));

test('renders dashboard shell navigation', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );

  const brandElement = screen.getByText(/AirPulse IQ/i);
  expect(brandElement).toBeInTheDocument();
});
