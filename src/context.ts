import { PrismaClient, Role } from "@prisma/client";
import { decodeAuthHeader, AuthTokenPayload } from "../utils/auth";
import { Request } from "express";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export interface Context {
  prisma: PrismaClient;
  userId?: number;
  userName?: string;
  userRole?: Role;
}

export const context = ({ req }: { req: Request }): Context => {
  const token =
    req && req.headers.authorization
      ? decodeAuthHeader(req.headers.authorization)
      : null;
  const deviceToken = "";
  return {
    prisma,
    userId: token?.userId,
    userName: token?.userName,
    userRole: token?.userRole,
  };
};
