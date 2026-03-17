import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const createMerchantUserSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  roleName: z.enum(['Kasir', 'Gudang']),
});

const updateMerchantUserRoleSchema = z.object({
  roleName: z.enum(['Kasir', 'Gudang']),
});

function getMerchantIdFromHeader(req: Request): bigint | null {
  const merchantIdHeader = req.headers['x-merchant-id'];

  if (!merchantIdHeader) return null;

  const merchantIdValue = Array.isArray(merchantIdHeader)
    ? merchantIdHeader[0]
    : merchantIdHeader;

  if (!merchantIdValue) return null;
  if (!/^\d+$/.test(merchantIdValue)) return null;

  return BigInt(merchantIdValue);
}

function getSingleParam(param: string | string[] | undefined): string | null {
  if (!param) return null;
  return Array.isArray(param) ? param[0] ?? null : param;
}

export async function createMerchantUser(req: Request, res: Response) {
  try {
    const authUser = req.authUser;
    const merchantId = getMerchantIdFromHeader(req);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: 'Header x-merchant-id tidak valid',
      });
    }

    const parsed = createMerchantUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || 'Validasi gagal',
      });
    }

    const { name, email, password, roleName } = parsed.data;
    const ownerUserId = BigInt(authUser.userId);

    const membershipOwner = await prisma.merchantUser.findFirst({
      where: {
        merchantId,
        userId: ownerUserId,
        status: 'active',
      },
      include: {
        role: true,
        merchant: true,
      },
    });

    if (!membershipOwner || membershipOwner.role.name !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Hanya Owner yang dapat menambahkan user',
      });
    }

    const selectedRole = await prisma.role.findUnique({
      where: {
        name: roleName,
      },
    });

    if (!selectedRole) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      let user = existingUser;

      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);

        user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            status: 'active',
          },
        });
      }

      const existingMembership = await tx.merchantUser.findFirst({
        where: {
          merchantId,
          userId: user.id,
        },
      });

      if (existingMembership) {
        throw new Error('USER_ALREADY_IN_MERCHANT');
      }

      const merchantUser = await tx.merchantUser.create({
        data: {
          merchantId,
          userId: user.id,
          roleId: selectedRole.id,
          status: 'active',
        },
        include: {
          user: true,
          role: true,
          merchant: true,
        },
      });

      await tx.auditLog.create({
        data: {
          merchantId,
          userId: ownerUserId,
          action: 'CREATE_MERCHANT_USER',
          entity: 'MerchantUser',
          entityId: merchantUser.id,
          description: `User ${merchantUser.user.email} ditambahkan ke merchant ${merchantUser.merchant.name} sebagai ${merchantUser.role.name}`,
        },
      });

      return merchantUser;
    });

    return res.status(201).json({
      success: true,
      message: 'User merchant berhasil ditambahkan',
      data: {
        merchantUserId: result.id.toString(),
        userId: result.user.id.toString(),
        name: result.user.name,
        email: result.user.email,
        role: result.role.name,
        status: result.status,
        merchantId: result.merchant.id.toString(),
        merchantName: result.merchant.name,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_ALREADY_IN_MERCHANT') {
      return res.status(409).json({
        success: false,
        message: 'User sudah terdaftar pada merchant ini',
      });
    }

    console.error('createMerchantUser error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
}

export async function getMerchantUsers(req: Request, res: Response) {
  try {
    const authUser = req.authUser;
    const merchantId = getMerchantIdFromHeader(req);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: 'Header x-merchant-id tidak valid',
      });
    }

    const userId = BigInt(authUser.userId);

    const requesterMembership = await prisma.merchantUser.findFirst({
      where: {
        merchantId,
        userId,
        status: 'active',
      },
      include: {
        role: true,
      },
    });

    if (!requesterMembership) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke merchant ini',
      });
    }

    const merchantUsers = await prisma.merchantUser.findMany({
      where: {
        merchantId,
      },
      include: {
        user: true,
        role: true,
        merchant: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: merchantUsers.map((item) => ({
        merchantUserId: item.id.toString(),
        userId: item.user.id.toString(),
        name: item.user.name,
        email: item.user.email,
        userStatus: item.user.status,
        membershipStatus: item.status,
        role: item.role.name,
        merchantId: item.merchant.id.toString(),
        merchantName: item.merchant.name,
      })),
    });
  } catch (error) {
    console.error('getMerchantUsers error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
}

export async function updateMerchantUserRole(req: Request, res: Response) {
  try {
    const authUser = req.authUser;
    const merchantId = getMerchantIdFromHeader(req);
    const merchantUserIdRaw = getSingleParam(req.params.id);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: 'Header x-merchant-id tidak valid',
      });
    }

    if (!merchantUserIdRaw || !/^\d+$/.test(merchantUserIdRaw)) {
      return res.status(400).json({
        success: false,
        message: 'ID merchant user tidak valid',
      });
    }

    const parsed = updateMerchantUserRoleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || 'Validasi gagal',
      });
    }

    const requesterUserId = BigInt(authUser.userId);
    const merchantUserId = BigInt(merchantUserIdRaw);
    const { roleName } = parsed.data;

    const requesterMembership = await prisma.merchantUser.findFirst({
      where: {
        merchantId,
        userId: requesterUserId,
        status: 'active',
      },
      include: {
        role: true,
      },
    });

    if (!requesterMembership || requesterMembership.role.name !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Hanya Owner yang dapat mengubah role user',
      });
    }

    const targetMembership = await prisma.merchantUser.findFirst({
      where: {
        id: merchantUserId,
        merchantId,
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        message: 'User merchant tidak ditemukan',
      });
    }

    if (targetMembership.role.name === 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Role Owner tidak dapat diubah dari endpoint ini',
      });
    }

    const newRole = await prisma.role.findUnique({
      where: {
        name: roleName,
      },
    });

    if (!newRole) {
      return res.status(404).json({
        success: false,
        message: 'Role tidak ditemukan',
      });
    }

    const updatedMembership = await prisma.$transaction(async (tx) => {
      const updated = await tx.merchantUser.update({
        where: {
          id: merchantUserId,
        },
        data: {
          roleId: newRole.id,
        },
        include: {
          user: true,
          role: true,
        },
      });

      await tx.auditLog.create({
        data: {
          merchantId,
          userId: requesterUserId,
          action: 'UPDATE_MERCHANT_USER_ROLE',
          entity: 'MerchantUser',
          entityId: updated.id,
          description: `Role user ${updated.user.email} diubah menjadi ${updated.role.name}`,
        },
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: 'Role user berhasil diperbarui',
      data: {
        merchantUserId: updatedMembership.id.toString(),
        userId: updatedMembership.user.id.toString(),
        name: updatedMembership.user.name,
        email: updatedMembership.user.email,
        role: updatedMembership.role.name,
        membershipStatus: updatedMembership.status,
      },
    });
  } catch (error) {
    console.error('updateMerchantUserRole error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
}

export async function deactivateMerchantUser(req: Request, res: Response) {
  try {
    const authUser = req.authUser;
    const merchantId = getMerchantIdFromHeader(req);
    const merchantUserIdRaw = getSingleParam(req.params.id);

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: 'Header x-merchant-id tidak valid',
      });
    }

    if (!merchantUserIdRaw || !/^\d+$/.test(merchantUserIdRaw)) {
      return res.status(400).json({
        success: false,
        message: 'ID merchant user tidak valid',
      });
    }

    const requesterUserId = BigInt(authUser.userId);
    const merchantUserId = BigInt(merchantUserIdRaw);

    const requesterMembership = await prisma.merchantUser.findFirst({
      where: {
        merchantId,
        userId: requesterUserId,
        status: 'active',
      },
      include: {
        role: true,
      },
    });

    if (!requesterMembership || requesterMembership.role.name !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Hanya Owner yang dapat menonaktifkan user',
      });
    }

    const targetMembership = await prisma.merchantUser.findFirst({
      where: {
        id: merchantUserId,
        merchantId,
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!targetMembership) {
      return res.status(404).json({
        success: false,
        message: 'User merchant tidak ditemukan',
      });
    }

    if (targetMembership.role.name === 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Owner tidak dapat dinonaktifkan dari endpoint ini',
      });
    }

    const updatedMembership = await prisma.$transaction(async (tx) => {
      const updated = await tx.merchantUser.update({
        where: {
          id: merchantUserId,
        },
        data: {
          status: 'inactive',
        },
        include: {
          user: true,
          role: true,
        },
      });

      await tx.auditLog.create({
        data: {
          merchantId,
          userId: requesterUserId,
          action: 'DEACTIVATE_MERCHANT_USER',
          entity: 'MerchantUser',
          entityId: updated.id,
          description: `User ${updated.user.email} dinonaktifkan dari merchant`,
        },
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: 'User merchant berhasil dinonaktifkan',
      data: {
        merchantUserId: updatedMembership.id.toString(),
        userId: updatedMembership.user.id.toString(),
        name: updatedMembership.user.name,
        email: updatedMembership.user.email,
        role: updatedMembership.role.name,
        membershipStatus: updatedMembership.status,
      },
    });
  } catch (error) {
    console.error('deactivateMerchantUser error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
}