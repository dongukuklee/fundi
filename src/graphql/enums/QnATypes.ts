import { QnATypes as QnATypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const QnATypes = enumType({
  name: "QnATypes",
  members: QnATypesInPrisma,
  description: "Define QnA Types",
});
