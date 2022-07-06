import { extendType, intArg, objectType, stringArg } from "nexus";

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

export const TransactionCashQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.nonNull.field("transactionsCash", {
      type: "TransactionCash",
      args: {
        skip: intArg(),
        take: intArg(),
        type: stringArg(), // SENT or RCVD or undefined
      },
      async resolve(parent, args, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot inquiry the transactions of the account without signing in."
          );
        }
        const where =
          args?.type === "SENT"
            ? { senderId: userId }
            : args?.type === "RCVD"
            ? { receiverId: userId }
            : { OR: [{ senderId: userId }, { receiverId: userId }] };

        const transactions = await context.prisma.transactionCash.findMany({
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
        });
        return transactions;
      },
    });
  },
});
