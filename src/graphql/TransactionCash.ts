import { objectType } from "nexus";

export const TransactionCash = objectType({
  name: "TransactionCash",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("title");
    t.field("sender", {
      type: "AccountCash",
      resolve(parent, args, context, info) {
        return context.prisma.transactionCash
          .findUnique({ where: { id: parent.id } })
          .sender();
      },
    });
    t.field("receiver", {
      type: "AccountCash",
      resolve(parent, args, context, info) {
        return context.prisma.transactionCash
          .findUnique({ where: { id: parent.id } })
          .receiver();
      },
    });
    t.nonNull.bigInt("amount");
    t.nonNull.field("type", { type: "TransactionCashType" });
  },
});
