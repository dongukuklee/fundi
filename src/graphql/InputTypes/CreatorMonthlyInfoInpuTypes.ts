import { inputObjectType } from "nexus";

export const CreatorMonthlyInfoInpuTypes = inputObjectType({
  name: "CreatorMonthlyInfoInpuTypes",
  definition(t) {
    t.string("month");
    t.bigInt("subscriber");
    t.bigInt("income");
    t.bigInt("views");
  },
});
