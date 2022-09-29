import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";

export const WithdrawalAccount = objectType({
  name: "WithdrawalAccount",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.int("bankCode");
    t.nonNull.string("accountNumber");
  },
});

export const WithdrawalAccountMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("registerWithdrawalAccount", {
      type: "WithdrawalAccount",
      args: {
        bankCode: nonNull(intArg()),
        accountNumber: nonNull(stringArg()),
      },
      async resolve(parent, { bankCode, accountNumber }, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot register withdrawal account without signing in."
          );
        }
        const auth = await context.prisma.auth.findFirst({
          where: { user: { id: userId } },
        });
        if (!auth) {
          throw new Error("No such user found");
        }
        return await context.prisma.withdrawalAccount.create({
          data: {
            bankCode,
            accountNumber,
            authId: auth.id,
          },
        });
      },
    });
  },
});
