import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import dotenv from 'dotenv';

dotenv.config();

const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env file.');
    throw new Error('JWT_SECRET is not defined');
  }

  // Normalize the expires value: if it's digits only -> number (seconds), otherwise keep string like '1h'
  const expiresEnv = process.env.JWT_EXPIRES_IN ?? '1h';
  const expiresInValue: string | number = /^\d+$/.test(expiresEnv) ? Number(expiresEnv) : expiresEnv;

  const options: SignOptions = {
    // Cast via unknown to satisfy TypeScript when types for jsonwebtoken are picky.
    expiresIn: expiresInValue as unknown as SignOptions['expiresIn'],
  };

  // secret is validated above; cast to Secret for jwt.sign typing
  return jwt.sign({ id }, secret as Secret, options);
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Special handling for admin user based on the prompt
    let role: 'user' | 'admin' = 'user';
    if (email === 'admin@gmail.com') {
      role = 'admin';
    }

    user = await User.create({
      name,
      email,
      passwordHash,
      role,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    res.status(200).json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
