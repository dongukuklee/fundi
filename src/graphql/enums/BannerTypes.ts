import { BannerTypes as BannerTypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const BannerTypes = enumType({
  name: "BannerTypes",
  members: BannerTypesInPrisma,
  description: "Define ContractStatus",
});
