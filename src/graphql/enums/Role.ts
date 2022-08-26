import { Role as RoleInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const Role = enumType({
  name: "Role",
  members: RoleInPrisma,
  description: "Define user roles",
});
