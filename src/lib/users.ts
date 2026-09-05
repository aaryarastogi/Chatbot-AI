import fs from 'fs';
import path from 'path';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/Hashed password for demo app
  image?: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Default initial users
const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_demo',
    name: 'Developer User',
    email: 'developer@example.com',
    passwordHash: 'demo123456',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer@example.com',
    createdAt: new Date().toISOString(),
  },
];

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing users data file:', err);
  }
}

export function getUsers(): UserAccount[] {
  ensureDataFile();
  try {
    const content = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return DEFAULT_USERS;
  }
}

export function findUserByEmail(email: string): UserAccount | undefined {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
}

export function createUser(name: string, email: string, passwordHash: string): UserAccount {
  ensureDataFile();
  const users = getUsers();

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    throw new Error('User with this email already exists.');
  }

  const newUser: UserAccount = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');

  return newUser;
}
