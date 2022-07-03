import { TransactionCashType as TransactionCashTypeInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const TransactionCashType = enumType({
  name: "TransactionCashType",
  members: TransactionCashTypeInPrisma,
  description: "Define transaction cash types",
});
