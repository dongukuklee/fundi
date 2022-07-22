import { TransactionType } from "@prisma/client";
import { arg, extendType, intArg, objectType, stringArg } from "nexus";
import { TAKE } from "../common/const";

export const TransactionCash = objectType({
  name: "TransactionCash",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("title");
    t.field("account", {
      type: "AccountCash",
      resolve(parent, args, context, info) {
        return context.prisma.transactionCash
          .findUnique({ where: { id: parent.id } })
          .account();
      },
    });
    t.nonNull.bigInt("amount");
    t.nonNull.field("type", { type: "TransactionType" });
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
        type: arg({ type: "TransactionType" }),
      },
      async resolve(parent, args, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot inquiry the transactions of the account without signing in."
          );
        }
        const transactions = await context.prisma.transactionCash.findMany({
          where: {
            accountId: userId,
            type: args?.type as TransactionType | undefined,
          },
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
        });
        return transactions;
      },
    });
  },
});
