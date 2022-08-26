import { ContractTypes as ContractTypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const ContractTypes = enumType({
  name: "ContractTypes",
  members: ContractTypesInPrisma,
  description: "Define ContractStatus",
});
