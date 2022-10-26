import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import {
  getCreateDateFormat,
  getFormatDate,
  getLocalDate,
} from "../../utils/Date";
import {
  getUserIDVerificationData,
  signinCheck,
} from "../../utils/getUserInfo";
import {
  checkAcntNm,
  makingMoneyTransfers,
} from "../../utils/infinisoftModules";
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
  const userIDVerification = await getUserIDVerificationData(context);
  const { birthDay, name } = userIDVerification;
  const birthDayFormat = getFormatDate(birthDay).substring(2);
  return await checkAcntNm(bankCode, acntNo, birthDayFormat, name);
};

export const WithdrawalAccountQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("getWithdrawalAccount", {
      type: "WithdrawalAccount",
      async resolve(parent, args, context, info) {
        const { userId } = context;
        signinCheck(userId);
        return await context.prisma.withdrawalAccount.findFirst({
          where: { auth: { user: { id: userId } } },
        });
      },
    });
  },
});

export const WithdrawalAccountMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("registerWithdrawalAccount", {
      type: "WithdrawalAccount",
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

        if (!accountIsExist) throw new Error("");
        try {
          return await context.prisma.withdrawalAccount.create({
            data: {
              ...getCreateDateFormat(),
              bankCode,
              acntNo,
              authId: auth.id,
            },
          });
        } catch (error) {
          throw new Error(`someting went wrong`);
        }
      },
    });
    t.field("updateWithdrawalAccount", {
      type: "WithdrawalAccount",
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

        if (!accountIsExist) throw new Error("account not found");

        try {
          const updateResult = await context.prisma.withdrawalAccount.update({
            where: { id },
            data: { updatedAt: getLocalDate(), bankCode, acntNo },
          });

          return updateResult;
        } catch (error) {
          throw new Error("");
        }
      },
    });
  },
});
