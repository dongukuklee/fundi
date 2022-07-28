import { Prisma, TransactionType } from "@prisma/client";
import { arg, extendType, intArg, list, objectType } from "nexus";
import { TAKE } from "../common/const";

export const TransactionBond = objectType({
  name: "TransactionBond",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("title");
    t.field("account", {
      type: "AccountBond",
      resolve(parent, args, context, info) {
        return context.prisma.transactionBond
          .findUnique({ where: { id: parent.id } })
          .account();
      },
    });
    t.nonNull.field("type", { type: "TransactionType" });
    t.nonNull.bigInt("amount");
  },
});

export const TransactionBondQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.nonNull.field("transactionsBond", {
      type: "TransactionBond",
      args: {
        ids: list(intArg()),
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
        const transactions = await context.prisma.transactionBond.findMany({
          where: {
            account: {
              id: { in: args?.ids } as Prisma.IntFilter | undefined,
              ownerId: userId,
            },
            type: args?.type as TransactionType | undefined,
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
        });
        return transactions;
      },
    });
  },
});
