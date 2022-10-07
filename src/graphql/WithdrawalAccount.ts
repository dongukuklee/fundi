import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { checkAcntNm } from "../../utils/infiniSoftModuls";
import { Context } from "../context";
export const WithdrawalAccount = objectType({
  name: "WithdrawalAccount",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("bankCode");
    t.nonNull.string("acntNo");
    t.field("name", {
      type: "String",
      async resolve(parent, args, context, info) {
        const result = await context.prisma.iDVerification.findFirst({
          where: { auth: { user: { id: context.userId } } },
          select: { name: true },
        });
        return result!.name;
      },
    });
  },
});

const checkAccount = async (
  context: Context,
  bankCode: string,
  acntNo: string
) => {
  const userIDVerification = await context.prisma.iDVerification.findFirst({
    where: { auth: { user: { id: context.userId } } },
  });
  if (!userIDVerification)
    throw new Error("user IDVerification data not found");
  const { birthDay, name } = userIDVerification;
  const birthDayFormat = `${birthDay.getFullYear() % 100}${
    birthDay.getMonth() + 1 < 10
      ? "0" + (birthDay.getMonth() + 1)
      : birthDay.getMonth() + 1
  }${birthDay.getDate()}`;
  return await checkAcntNm(bankCode, acntNo, birthDayFormat, name);
};

export const WithdrawalAccountQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("getWithdrawalAccount", {
      type: "WithdrawalAccount",
      resolve(parent, args, context, info) {
        if (!context.userId)
          throw new Error(
            "Cannot inquery withdrawal account without signing in."
          );

        return context.prisma.withdrawalAccount.findFirst({
          where: { auth: { user: { id: context.userId } } },
        });
      },
    });
  },
});

export const WithdrawalAccountMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("registerWithdrawalAccount", {
      type: "Boolean",
      args: {
        bankCode: nonNull(stringArg()),
        acntNo: nonNull(stringArg()),
      },
      async resolve(parent, { bankCode, acntNo }, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot register withdrawal account without signing in."
          );
        }
        const accountIsExist = await checkAccount(context, bankCode, acntNo);
        const auth = await context.prisma.auth.findFirst({
          where: { user: { id: userId } },
        });
        if (!auth) {
          throw new Error("No such user found");
        }

        if (!accountIsExist) return false;
        try {
          await context.prisma.withdrawalAccount.create({
            data: {
              bankCode,
              acntNo,
              authId: auth.id,
            },
          });
          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
    t.field("updateWithdrawalAccount", {
      type: "Boolean",
      args: {
        id: nonNull(intArg()),
        bankCode: nonNull(stringArg()),
        acntNo: nonNull(stringArg()),
      },
      async resolve(parent, { id, bankCode, acntNo }, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot update withdrawal account without signing in."
          );
        }
        const accountIsExist = await checkAccount(context, bankCode, acntNo);
        const auth = await context.prisma.auth.findFirst({
          where: { user: { id: userId } },
        });
        if (!auth) {
          throw new Error("No such user found");
        }

        if (!accountIsExist) return false;
        try {
          const deleteWithdrawalAccount =
            context.prisma.withdrawalAccount.delete({ where: { id } });
          const createWithdrawalAccount =
            context.prisma.withdrawalAccount.create({
              data: {
                bankCode,
                acntNo,
                authId: auth.id,
              },
            });
          await context.prisma.$transaction([
            deleteWithdrawalAccount,
            createWithdrawalAccount,
          ]);
          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
  },
});
