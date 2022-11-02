import { NoticeType as NoticeTypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const NoticeTypes = enumType({
  name: "NoticeTypes",
  members: NoticeTypesInPrisma,
  description: "Define funding status",
});
