import { inputObjectType } from "nexus";

export const ContractInput = inputObjectType({
  name: "ContractInput",
  definition(t) {
    t.nonNull.int("lastYearEarning");
    t.nonNull.int("terms");
    t.nonNull.int("fundRasingRatio");
    t.nonNull.int("additionalFee");
    t.nonNull.string("startDate");
    t.nonNull.string("endDate");
    t.nonNull.field("type", { type: "ContractTypes" });
  },
});
