import { FundingStatus as FundingStatusInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const FundingStatus = enumType({
  name: "FundingStatus",
  members: FundingStatusInPrisma,
  description: "Define funding status",
});
