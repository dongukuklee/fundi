import {
  arg,
  extendType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from "nexus";
import { each } from "underscore";
import { AppPushAndCreateAlarm } from "../../utils/appPushAndCreateAlarm";
import {
  getCreateDateFormat,
  getFormatDate,
  getLocalDate,
} from "../../utils/Date";
import {
  getUserAccountCash,
  getUserIDVerificationData,
  signinCheck,
} from "../../utils/getUserInfo";

import {
  makingMoneyTransfers,
  checkAcntNm,
} from "../../utils/infinisoftModules";
import { TAKE } from "../common/const";

export const AccountTransfer = objectType({
  name: "AccountTransfer",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("bankCode");
    t.nonNull.string("acntNo");
    t.nonNull.string("amt");
    t.nonNull.string("transDt");
    t.nonNull.string("resultMsg");
    t.nonNull.field("status", {
      type: "AccountTransferTypes",
    });
    t.field("user", {
      type: "User",
      resolve(parent, args, context, info) {
        return context.prisma.accountTransfer
          .findUnique({ where: { id: parent.id } })
          .user();
      },
    });
  },
});

export const AccountTransferQuery = extendType({
  type: "Query",
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
      args: {
        skip: intArg(),
        take: intArg(),
        status: arg({ type: "AccountTransferTypes" }),
      },
      async resolve(parent, { skip, take, status }, context, info) {
        return await context.prisma.accountTransfer.findMany({
          skip: skip as number | undefined,
          take: take ? take : TAKE,
          where: {
            status: status ? status : "PENDING",
          },
        });
      },
    });

    t.list.field("myAccountTransfers", {
      type: "AccountTransfer",
      args: {
        skip: intArg(),
        take: intArg(),
        status: arg({ type: "AccountTransferTypes" }),
      },
      async resolve(parent, { skip, take, status }, context, info) {
        const { userId } = context;
        signinCheck(userId);
        return await context.prisma.accountTransfer.findMany({
          skip: skip as number | undefined,
          take: take ? take : TAKE,
          where: { userId, status: status ? status : "PENDING" },
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

        const IDVerification = await context.prisma.iDVerification.findFirst({
          where: { auth: { user: { id: userId } } },
        });
        const { birthDay } = IDVerification!;

        const { acntNo, bankCode } = withdrawalAccount;
        const updateAccountCash = context.prisma.accountCash.update({
          where: { ownerId: userId },
          data: {
            balance: {
              decrement: amt,
            },
            updatedAt: getLocalDate(),
            transactions: {
              create: {
                amount: amt,
                title: "출금 신청",
                type: "WITHDRAW",
                accumulatedCash: balance - BigInt(amt),
                ...getCreateDateFormat(),
              },
            },
          },
        });
        const createAccountTransfer = context.prisma.accountTransfer.create({
          data: {
            acntNo,
            amt: String(amt),
            bankCode,
            userId: userId!,
            userBirthDay: getFormatDate(birthDay).substring(2),
            ...getCreateDateFormat(),
          },
        });

        const result = await context.prisma.$transaction([
          updateAccountCash,
          createAccountTransfer,
        ]);
        return result[1];
      },
    });
    t.field("moneyTransfer", {
      type: "Boolean",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        const fee = process.env.WITHDRAWAL_FEE;
        const accountTransfer = await context.prisma.accountTransfer.findUnique(
          {
            where: { id },
          }
        );

        if (!accountTransfer) throw new Error("account Transfer not found");
        const { acntNo, amt, bankCode, userBirthDay, userId } = accountTransfer;
        const userInfo = await context.prisma.iDVerification.findFirst({
          where: { auth: { user: { id: userId } } },
        });
        const { name } = userInfo!;
        try {
          const isMatch = await checkAcntNm(
            bankCode,
            acntNo,
            userBirthDay,
            name
          );
          if (!isMatch) throw new Error("The account does not match.");

          const isSuccess = await makingMoneyTransfers(
            bankCode,
            acntNo,
            name,
            String(Number(amt) - Number(fee))
          );
          if (isSuccess) {
            await context.prisma.accountTransfer.update({
              where: { id },
              data: { status: "DONE" },
            });
            return true;
          } else return false;
        } catch (error) {
          console.log(error);
          return false;
        }
      },
    });
    t.list.field("multipleMoneyTransfers", {
      type: "AccountTransfer",
      args: {
        ids: nonNull(list(nonNull(intArg()))),
      },
      async resolve(parent, { ids }, context, info) {
        console.log(ids);
        const fee = process.env.WITHDRAWAL_FEE;
        const accountTransfers = await context.prisma.accountTransfer.findMany({
          where: { id: { in: ids } },
        });

        if (!accountTransfers || !accountTransfers.length) {
          throw new Error("account Transfer not found");
        }
        const UpdateAccountTransfer: any[] = [];
        const appPushAndCreateAlarms: any[] = [];
        for (const accountTransfer of accountTransfers) {
          const { id, acntNo, amt, bankCode, userBirthDay, userId } =
            accountTransfer;
          const userInfo = await context.prisma.iDVerification.findFirst({
            where: { auth: { user: { id: userId } } },
          });
          const { name } = userInfo!;
          const isMatch = await checkAcntNm(
            bankCode,
            acntNo,
            userBirthDay,
            name
          );
          if (!isMatch) throw new Error("The account does not match.");

          const result = await makingMoneyTransfers(
            bankCode,
            acntNo,
            name,
            String(Number(amt) - Number(fee))
          );
          const { resultMsg, transDt, resultCode } = result;
          if (resultCode === "0000") {
            UpdateAccountTransfer.push(
              context.prisma.accountTransfer.update({
                where: { id },
                data: {
                  status: "DONE",
                  updatedAt: getLocalDate(),
                  resultMsg,
                  transDt,
                },
              })
            );

            appPushAndCreateAlarms.push(
              AppPushAndCreateAlarm(
                {
                  content: `${accountTransfer.amt}원 이체 완료.`,
                  sentTime: getLocalDate(),
                  title: "입금 이체 완료",
                  type: "ETC",
                },
                accountTransfer.userId,
                context
              )
            );
          } else {
            UpdateAccountTransfer.push(
              context.prisma.accountTransfer.update({
                where: { id },
                data: {
                  status: "CANCELLATION",
                  updatedAt: getLocalDate(),
                  resultMsg,
                  transDt,
                },
              })
            );
            appPushAndCreateAlarms.push(
              AppPushAndCreateAlarm(
                {
                  content: `fundi 앱에서 자세한 내용을 확인하세요.`,
                  sentTime: getLocalDate(),
                  title: "입금 이체 실패",
                  type: "ETC",
                },
                accountTransfer.userId,
                context
              )
            );
          }
        }
        Promise.all(appPushAndCreateAlarms);
        return await context.prisma.$transaction(UpdateAccountTransfer);
      },
    });
  },
});
