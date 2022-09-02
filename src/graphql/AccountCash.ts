import {
  extendType,
  intArg,
  nonNull,
  objectType,
  queryType,
  stringArg,
} from "nexus";

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
    t.nonNull.list.nonNull.field("transactions", {
      type: "TransactionCash",
      resolve(parent, args, context, info) {
        return context.prisma.accountCash
          .findUnique({ where: { id: parent.id } })
          .transactions();
      },
    });
  },
});

export const AccountCashQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("balanceCash", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot inquiry the balance of the account without signing in."
          );
        }
        const account = await context.prisma.user
          .findUnique({ where: { id: userId } })
          .accountCash();
        if (!account) {
          throw new Error("You don't have a cash account.");
        }

        return account.balance;
      },
    });
  },
});

export const AccountBondMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("chargeTheDeposit", {
      type: "AccountCash",
      args: {
        amount: nonNull(intArg()),
      },
      async resolve(parent, { amount }, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot inquiry the balance of the account without signing in."
          );
        }
        const accountCash = await context.prisma.accountCash.findFirst({
          where: {
            ownerId: context.userId,
          },
          select: {
            balance: true,
          },
        });
        return await context.prisma.accountCash.update({
          where: { ownerId: userId },
          data: {
            balance: { increment: BigInt(amount) },
            transactions: {
              create: {
                amount: BigInt(amount),
                type: "DEPOSIT",
                title: `${context.userName}님의 예치금 충전 내역`,
                accumulatedCash: accountCash?.balance! + BigInt(amount),
              },
            },
          },
        });
      },
    });
  },
});
