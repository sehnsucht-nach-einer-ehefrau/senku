import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { sign } from 'jsonwebtoken';
import crypto from 'crypto';

type ResponseData = {
  success?: boolean;
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only accept POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const correctPassword = process.env.APP_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!correctPassword || !jwtSecret) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (password === correctPassword) {
    // Generate a session ID (prevents cookie replay attacks)
    const sessionId = crypto.randomUUID();
    
    // Create a JWT token with expiration
    const token = sign(
      { 
        sessionId,
        // Add an issued-at timestamp
        iat: Math.floor(Date.now() / 1000),
      },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Set a secure HTTP-only cookie with the JWT
    res.setHeader('Set-Cookie', serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict'
    }));

    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }
}