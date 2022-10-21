import { TradeStatus as TradeStatusTypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const TradeStatus = enumType({
  name: "TradeStatus",
  members: TradeStatusTypesInPrisma,
  description: "Define Trade status",
});
