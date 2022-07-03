import { objectType } from "nexus";

export const TransactionBond = objectType({
  name: "TransactionBond",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("title");
    t.field("sender", {
      type: "AccountBond",
      resolve(parent, args, context, info) {
        return context.prisma.transactionBond
          .findUnique({ where: { id: parent.id } })
          .sender();
      },
    });
    t.field("receiver", {
      type: "AccountBond",
      resolve(parent, args, context, info) {
        return context.prisma.transactionBond
          .findUnique({ where: { id: parent.id } })
          .receiver();
      },
    });
    t.nonNull.bigInt("amount");
  },
});
