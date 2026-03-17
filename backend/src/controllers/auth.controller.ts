import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';

type UserWithMerchantUsers = Prisma.UserGetPayload<{
  include: {
    merchantUsers: {
      include: {
        merchant: true;
        role: true;
      };
    };
  };
}>;

const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export async function registerOwner(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || 'Validasi gagal',
      });
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status: 'active',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('registerOwner error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || 'Validasi gagal',
      });
    }

    const { email, password } = parsed.data;

    const user: UserWithMerchantUsers | null = await prisma.user.findUnique({
      where: { email },
      include: {
        merchantUsers: {
          where: {
            status: 'active',
          },
          include: {
            merchant: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User tidak aktif',
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const token = signToken({
      userId: user.id.toString(),
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
        },
        merchants: user.merchantUsers.map((item: any) => ({
          merchantUserId: item.id.toString(),
          merchantId: item.merchant.id.toString(),
          merchantName: item.merchant.name,
          role: item.role.name,
          membershipStatus: item.status,
        })),
      },
    });
  } catch (error) {
    console.error('login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
}

export async function logout(_req: Request, res: Response) {
  try {
    res.clearCookie('token');

    return res.status(200).json({
      success: true,
      message: 'Logout berhasil',
    });
  } catch (error) {
    console.error('logout error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const authUser = req.authUser;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user: UserWithMerchantUsers | null = await prisma.user.findUnique({
      where: {
        id: BigInt(authUser.userId),
      },
      include: {
        merchantUsers: {
          where: {
            status: 'active',
          },
          include: {
            merchant: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          status: user.status,
        },
        merchants: user.merchantUsers.map((item: any) => ({
          merchantUserId: item.id.toString(),
          merchantId: item.merchant.id.toString(),
          merchantName: item.merchant.name,
          merchantStatus: item.merchant.status,
          role: item.role.name,
        })),
      },
    });
  } catch (error) {
    console.error('me error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
}