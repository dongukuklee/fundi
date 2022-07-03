import { Role } from "@prisma/client";
import * as jwt from "jsonwebtoken";

const APP_SECRET = process.env.APP_SECRET!;

export interface AuthTokenPayload {
  userId: number;
  userName: string;
  userRole: Role;
}

export function decodeAuthHeader(authHeader: string): AuthTokenPayload {
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new Error("No token found");
  }
  return jwt.verify(token, APP_SECRET) as AuthTokenPayload;
}
