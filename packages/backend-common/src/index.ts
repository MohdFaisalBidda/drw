export const NEXTAUTH_SECRET = {
    secret: process.env.NEXTAUTH_SECRET || 'your-strong-secret-here',
    expiresIn: '7d'
  };