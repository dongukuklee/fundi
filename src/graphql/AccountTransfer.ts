import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { getFormatDate } from "../../utils/Date";
import {
  getUserAccountCash,
  getUserIDVerificationData,
  signinCheck,
} from "../../utils/getUserInfo";

import {
  makingMoneyTransfers,
  checkAcntNm,
} from "../../utils/infinisoftModules";

export const AccountTransfer = objectType({
  name: "AccountTransfer",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("bankCode");
    t.nonNull.string("acntNo");
    t.nonNull.string("amt");
  },
});

export const AccountTransferQuery = extendType({
  type: "AccountTransfer",
  definition(t) {
    t.field("accountTransfer", {
      type: "AccountTransfer",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        return await context.prisma.accountTransfer.findUnique({
          where: { id },
        });
      },
    });
    t.field("myAccountTransfer", {
      type: "AccountTransfer",
      async resolve(parent, args, context, info) {
        const { userId } = context;
        signinCheck(userId);
        return await context.prisma.accountTransfer.findFirst({
          where: { userId },
        });
      },
    });
    t.list.field("accountTransfers", {
      type: "AccountTransfer",
      async resolve(parent, args, context, info) {
        return await context.prisma.accountTransfer.findMany({});
      },
    });
    t.list.field("myAccountTransfers", {
      type: "AccountTransfer",
      async resolve(parent, args, context, info) {
        const { userId } = context;
        signinCheck(userId);
        return await context.prisma.accountTransfer.findMany({
          where: { userId, status: "PENDING" },
        });
      },
    });
  },
});

export const AccountTransferMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("withdrawalApplication", {
      type: "AccountTransfer",
      args: {
        amt: nonNull(intArg()),
      },
      async resolve(parent, { amt }, context, info) {
        const { userId } = context;
        const userAccountCash = await getUserAccountCash(context);

        if (amt < 10000)
          throw new Error("Withdrawal amount must be at least 10000");

        const { balance } = userAccountCash!;
        if (balance < BigInt(amt))
          throw new Error("You cannot withdrawal than the remaining balance");
        const withdrawalAccount =
          await context.prisma.withdrawalAccount.findFirst({
            where: { auth: { user: { id: userId } } },
          });

        if (!withdrawalAccount) throw new Error("Withdrawal account not found");

        const { acntNo, bankCode } = withdrawalAccount;
        const updateAccountCash = context.prisma.accountCash.update({
          where: { ownerId: userId },
          data: {
            balance: {
              decrement: amt,
            },
            transactions: {
              create: {
                amount: amt,
                title: "출금 신청",
                type: "WITHDRAW",
                accumulatedCash: balance - BigInt(amt),
              },
            },
          },
        });
        const createAccountTransfer = context.prisma.accountTransfer.create({
          data: { acntNo, amt: String(amt), bankCode, userId: userId! },
        });
        const result = await context.prisma.$transaction([
          updateAccountCash,
          createAccountTransfer,
        ]);
        return result[1];
      },
    });
    t.field("makingMoneyTransfers", {
      type: "Boolean",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        const fee = process.env.WITHDRAWAL_FEE;
        const userInfo = await getUserIDVerificationData(context);
        const accountTransfer = await context.prisma.accountTransfer.findUnique(
          {
            where: { id },
          }
        );

        if (!accountTransfer) throw new Error("account Transfer not found");
        const { acntNo, amt, bankCode, userBirthDay } = accountTransfer;
        const { name } = userInfo;
        try {
          if (await checkAcntNm(bankCode, acntNo, userBirthDay, name))
            throw new Error("The account does not match.");

          await makingMoneyTransfers(
            bankCode,
            acntNo,
            name,
            String(Number(amt) - Number(fee))
          );
          return true;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
  },
});
