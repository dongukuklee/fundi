import { objectType } from "nexus";

export const TransactionSettlement = objectType({
  name: "TransactionSettlement",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.field("account", {
      type: "AccountBond",
      resolve(parent, args, context, info) {
        return context.prisma.transactionSettlement
          .findUnique({
            where: { id: parent.id },
          })
          .account();
      },
    });
    t.nonNull.int("round");
    t.nonNull.bigInt("settlementAmount");
    t.nonNull.bigInt("additionalSettleMentAmount");
  },
});
