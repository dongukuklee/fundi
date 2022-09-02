import { AlarmTypes as AlarmTypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const AlarmTypes = enumType({
  name: "AlarmTypes",
  members: AlarmTypesInPrisma,
  description: "Define alarm types",
});
