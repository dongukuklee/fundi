import { objectType } from "nexus";

export const Contract = objectType({
  name: "Contract",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.field("type", { type: "ContractTypes" });
    t.field("funding", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.contract
          .findUnique({ where: { id: parent.id } })
          .funding();
      },
    });
    t.nonNull.bigInt("lastYearEarning");
    t.nonNull.bigInt("amountRecieved");
    t.nonNull.int("terms");
    t.nonNull.dateTime("startDate");
    t.nonNull.dateTime("endDate");
  },
});
