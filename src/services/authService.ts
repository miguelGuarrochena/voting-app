import { simulateApiCall, storage } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Mock user database
const getUsers = (): User[] => storage.get<User>('users');

const saveUsers = (users: User[]): void => {
  storage.set('users', users);
};

// Generate mock users for demo
const generateMockUsers = (): User[] => {
  return [
    {
      id: 'demo-user-1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    },
    {
      id: 'demo-user-2', 
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
    }
  ];
};

// Initialize mock users if none exist
const initializeMockUsers = (): void => {
  const existingUsers = getUsers();
  if (existingUsers.length === 0) {
    const mockUsers = generateMockUsers();
    saveUsers(mockUsers);
  }
};

export const authService = {
  // Sign up new user
  signUp: async (data: SignUpData): Promise<{ user: User; success: boolean }> => {
    // Validate input
    if (!data.name.trim() || data.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    
    if (!data.email.trim() || !data.email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const users = getUsers();
    
    // Check if email already exists
    const existingUser = users.find(user => user.email.toLowerCase() === data.email.toLowerCase());
    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      createdAt: new Date()
    };

    // Save user
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    // Auto login by setting current user
    storage.setSingle('currentUser', newUser);

    return simulateApiCall({ user: newUser, success: true }).then(response => ({
      user: response.data.user,
      success: response.data.success
    }));
  },

  // Sign in existing user
  signIn: async (data: SignInData): Promise<{ user: User; success: boolean }> => {
    if (!data.email.trim() || !data.password) {
      throw new Error('Please enter email and password');
    }

    const users = getUsers();
    
    // Find user by email (mock password check - in real app would verify hash)
    const user = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    
    if (!user) {
      throw new Error('No account found with this email address');
    }

    // Mock password validation (any password works for demo users)
    // In production, you'd verify against hashed password
    if (data.email === 'alex@example.com' && data.password !== 'demo123') {
      throw new Error('Incorrect password');
    }
    if (data.email === 'sarah@example.com' && data.password !== 'demo123') {
      throw new Error('Incorrect password');
    }

    // Set current user
    storage.setSingle('currentUser', user);

    return simulateApiCall({ user, success: true }).then(response => ({
      user: response.data.user,
      success: response.data.success
    }));
  },

  // Sign out current user
  signOut: async (): Promise<void> => {
    storage.remove('currentUser');
    await simulateApiCall(undefined);
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return storage.getSingle<User>('currentUser');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return storage.getSingle<User>('currentUser') !== null;
  },

  // Initialize auth service
  initialize: (): void => {
    initializeMockUsers();
  }
};

// Initialize on import
authService.initialize();
