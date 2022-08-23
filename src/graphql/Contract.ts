import { objectType } from "nexus";

export const Contract = objectType({
  name: "Contract",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.field("funding", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.contract
          .findUnique({ where: { id: parent.id } })
          .funding();
      },
    });
    t.nonNull.bigInt("lastYearEarning");
    t.nonNull.bigInt("loan");
    t.nonNull.int("terms");
    t.nonNull.dateTime("startDate");
    t.nonNull.dateTime("endDate");
  },
});
