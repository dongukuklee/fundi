import { objectType, queryType } from "nexus";

export const AccountCash = objectType({
  name: "AccountCash",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.bigInt("balance");
    t.field("owner", {
      type: "User",
      resolve(parent, args, context, info) {
        return context.prisma.accountCash
          .findUnique({ where: { id: parent.id } })
          .owner();
      },
    });
    t.nonNull.list.nonNull.field("transactionSent", {
      type: "TransactionCash",
      resolve(parent, args, context, info) {
        return context.prisma.accountCash
          .findUnique({ where: { id: parent.id } })
          .transactionsSent();
      },
    });
    t.nonNull.list.nonNull.field("transactionRcvd", {
      type: "TransactionCash",
      resolve(parent, args, context, info) {
        return context.prisma.accountCash
          .findUnique({ where: { id: parent.id } })
          .transactionsRcvd();
      },
    });
  },
});
