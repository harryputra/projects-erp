import jwt from 'jsonwebtoken';

export type JwtPayload = {
  userId: string;
};

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
}