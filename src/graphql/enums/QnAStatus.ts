import { QnAStatus as QnAStatusInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const QnAStatus = enumType({
  name: "QnAStatus",
  members: QnAStatusInPrisma,
  description: "Define QnA Status",
});
