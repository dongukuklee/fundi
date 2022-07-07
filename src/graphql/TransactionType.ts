import { TransactionType as TransactionTypeInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const TransactionType = enumType({
  name: "TransactionType",
  members: TransactionTypeInPrisma,
  description: "Define transaction types - DEPOSIT and WITHDRAW",
});
