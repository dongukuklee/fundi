import { FAQTypes as FAQTypesInPrisma } from "@prisma/client";
import { enumType } from "nexus";

export const FAQTypes = enumType({
  name: "FAQTypes",
  members: FAQTypesInPrisma,
  description: "Define FAQ Types",
});
