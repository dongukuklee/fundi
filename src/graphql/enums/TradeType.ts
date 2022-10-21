import { TradeType as TradeTypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const TradeType = enumType({
  name: "TradeType",
  members: TradeTypesInPrisma,
  description: "Define trade types",
});
