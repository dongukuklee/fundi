import { TransactionType } from "@prisma/client";
import { arg, extendType, intArg, objectType, stringArg } from "nexus";
import { signinCheck } from "../../utils/getUserInfo";
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
    t.nonNull.bigInt("accumulatedCash");
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
        signinCheck(userId);
        const userAccountCash = await context.prisma.accountCash.findUnique({
          where: { ownerId: userId },
        });
        if (!userAccountCash) {
          throw new Error("account cash not found");
        }
        const transactions = await context.prisma.transactionCash.findMany({
          where: {
            accountId: userAccountCash.id,
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
