import { AccountTransferTypes as AccountTransferTypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const AccountTransferTypes = enumType({
  name: "AccountTransferTypes",
  members: AccountTransferTypesInPrisma,
  description: "Define AccountTransfer types",
});
