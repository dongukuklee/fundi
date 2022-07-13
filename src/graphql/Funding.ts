import { AccountBond, Role, User } from "@prisma/client";
import { extendType, intArg, nonNull, objectType } from "nexus";
import { TransactionType } from "@prisma/client";
import { TAKE } from "../common/const";
import { Context } from "../context";

const getInvestor = async (context: Context, fundingId: number) => {
  const { userId } = context;

  let investor = await context.prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      accountCash: {
        select: { id: true, balance: true },
      },
      accountsBond: {
        where: {
          fundingId,
        },
        include: {
          funding: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  return investor;
};

const getFunding = async (context: Context, fundingId: number) => {
  const funding = await context.prisma.funding.findUnique({
    where: { id: fundingId },
    select: {
      bondsTotalNumber: true,
      bondPrice: true,
      accountsBond: {
        where: {
          owner: {
            role: Role.MANAGER,
          },
        },
        include: {
          owner: {
            include: {
              accountCash: true,
            },
          },
        },
      },
    },
  });
  return funding;
};

export const Funding = objectType({
  name: "Funding",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.field("status", { type: "FundingStatus" });
    t.nonNull.string("title");
    t.field("artist", {
      type: "Artist",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .artist();
      },
    });
    t.field("contract", {
      type: "Contract",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .contract();
      },
    });
    t.nonNull.bigInt("bondPrice");
    t.nonNull.bigInt("bondsTotalNumber");
    t.nonNull.list.nonNull.field("artworks", {
      type: "Artwork",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .artworks();
      },
    });
    t.nonNull.field("bondsRemaining", {
      type: "BigInt",
      async resolve(parent, args, context, info) {
        const accountManager = (await context.prisma.accountBond.findFirst({
          where: {
            AND: {
              fundingId: parent.id,
              owner: {
                role: Role.MANAGER,
              },
            },
          },
          select: {
            balance: true,
          },
        })) as AccountBond | undefined;
        if (!accountManager) {
          throw new Error("accountManager not found");
        }
        return accountManager.balance;
      },
    });
    t.nonNull.list.nonNull.field("accounstInvestor", {
      type: "AccountBond",
      async resolve(parent, args, context, info) {
        const { userRole } = context;
        if (userRole !== Role.ADMIN && userRole !== Role.MANAGER) {
          throw new Error(
            "Only the manager and administrator can inquiry accounts of fundings."
          );
        }
        return await context.prisma.accountBond.findMany({
          where: {
            AND: {
              fundingId: parent.id,
              owner: {
                role: Role.INVESTOR,
              },
            },
          },
        });
      },
    });
    t.field("accountManager", {
      type: "AccountBond",
      async resolve(parent, args, context, info) {
        const { userRole } = context;
        if (userRole !== Role.ADMIN && userRole !== Role.MANAGER) {
          throw new Error(
            "Only the manager and administrator can inquiry accounts of fundings."
          );
        }
        return await context.prisma.accountBond.findFirst({
          where: {
            AND: {
              fundingId: parent.id,
              owner: {
                role: Role.MANAGER,
              },
            },
          },
        });
      },
    });
  },
});

export const FundingQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("funding", {
      type: "Funding",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        return await context.prisma.funding.findUnique({
          where: {
            id,
          },
        });
      },
    });
    t.nonNull.list.nonNull.field("fundings", {
      type: "Funding",
      args: {
        skip: intArg(),
        take: intArg(),
      },
      async resolve(parent, args, context, info) {
        const funding = await context.prisma.funding.findMany({
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
        });
        return funding;
      },
    });
    t.nonNull.list.nonNull.field("myFundings", {
      type: "Funding",
      args: {
        skip: intArg(),
        take: intArg(),
      },
      async resolve(parent, args, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error("Cannot inquiry my funding list without signing in.");
        }
        return await context.prisma.funding.findMany({
          where: {
            accountsBond: {
              every: {
                ownerId: userId,
              },
            },
          },
        });
      },
    });
  },
});

export const FundingMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("participateFunding", {
      type: "AccountBond",
      args: {
        id: nonNull(intArg()),
        amount: nonNull(intArg()),
      },
      async resolve(parent, args, context, info) {
        const { id, amount } = args;
        const { userId } = context;

        if (!userId) {
          throw new Error(
            "Cannot participate in a funding without signing in."
          );
        }

        //유저 계좌 조회
        let investor = await getInvestor(context, id);

        if (
          !investor ||
          !investor.accountCash ||
          investor.accountsBond.length > 1
        ) {
          throw new Error("Invalid user");
        }

        // 펀드 조회
        const funding = await getFunding(context, id);

        if (!funding || !funding.accountsBond) {
          throw new Error("Invalid funding");
        }

        const investmentPrice = funding.bondPrice * BigInt(amount);

        if (investmentPrice > investor.accountCash.balance) {
          throw new Error("Your account does not have sufficient balance.");
        }

        if (amount > funding.accountsBond[0].balance) {
          throw new Error("You cannot buy more than the remaining bonds");
        }

        // 해당 채권 계좌가 없는 경우에 채권 계좌 개설
        if (investor.accountsBond.length === 0) {
          investor = await context.prisma.user.update({
            where: {
              id: userId,
            },
            data: {
              accountsBond: {
                create: {
                  fundingId: id,
                  balance: 0,
                },
              },
            },
            include: {
              accountCash: {
                select: { id: true, balance: true },
              },
              accountsBond: {
                where: {
                  fundingId: id,
                },
                select: {
                  id: true,
                },
                include: {
                  funding: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          });
        }

        if (investor.accountsBond.length !== 1) {
          throw new Error("Invalid user");
        }

        const accountCashIdInvestor = investor.accountCash?.id;
        const accountBondIdInvestor = investor.accountsBond[0].id;
        const accountCashIdManager =
          funding.accountsBond[0].owner.accountCash?.id;
        const accountBondIdManager = funding.accountsBond[0].id;

        await context.prisma.$transaction([
          context.prisma.accountCash.update({
            where: {
              id: accountCashIdInvestor,
            },
            data: {
              balance: {
                decrement: investmentPrice,
              },
              transactions: {
                create: {
                  amount: investmentPrice,
                  title: "구매",
                  type: TransactionType.WITHDRAW,
                },
              },
            },
          }),
          context.prisma.accountBond.update({
            where: {
              id: accountBondIdManager,
            },
            data: {
              balance: {
                decrement: amount,
              },
              transactions: {
                create: {
                  amount: amount,
                  title: "매도",
                  type: TransactionType.WITHDRAW,
                },
              },
            },
          }),
          context.prisma.accountCash.update({
            where: {
              id: accountCashIdManager,
            },
            data: {
              balance: {
                increment: investmentPrice,
              },
              transactions: {
                create: {
                  amount: investmentPrice,
                  title: "판매",
                  type: TransactionType.DEPOSIT,
                },
              },
            },
          }),
          context.prisma.accountBond.update({
            where: {
              id: accountBondIdInvestor,
            },
            data: {
              balance: {
                increment: amount,
              },
              transactions: {
                create: {
                  amount: amount,
                  title: "매수",
                  type: TransactionType.DEPOSIT,
                },
              },
            },
          }),
        ]);

        return context.prisma.accountBond.findUnique({
          where: {
            id: accountBondIdInvestor,
          },
          include: {
            transactions: {
              skip: 0,
              take: TAKE,
            },
          },
        });
      },
    });
    t.field("withdrawFunding", {
      type: "AccountBond",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        const { userId } = context;

        if (!userId) {
          throw new Error("Cannot withdraw in a funding without signing in.");
        }
        let investor = await getInvestor(context, id);

        if (
          !investor ||
          !investor.accountCash ||
          investor.accountsBond.length > 1
        ) {
          throw new Error("Invalid user");
        }

        // 펀드 조회
        const funding = await getFunding(context, id);

        if (!funding || !funding.accountsBond) {
          throw new Error("Invalid funding");
        }
        const settlementedAmount =
          await context.prisma.transactionSettlement.findMany({
            where: {
              AND: [
                {
                  accountId: investor.accountsBond[0].id,
                  account: {
                    fundingId: id,
                  },
                },
              ],
            },
          });
        const totalSettlementedAmount = settlementedAmount.reduce(
          (acc, cur) => acc + cur.settlementAmount,
          BigInt(0)
        );
        const totalAmount =
          funding.bondPrice * investor.accountsBond[0].balance -
          totalSettlementedAmount;
        //(투자 원금 - 총 전산 금액
        const fee = (totalAmount / BigInt(10)) * BigInt(3);
        //수수료  (투자 원금 - 총 전산 금액) 의 30%
        const totalRefundAmount = totalAmount - fee;
        //총 환불금액 (투자 원금 - 총 전산 금액) - 수수료

        const accountCashIdInvestor = investor.accountCash?.id;
        const accountCashIdManager =
          funding.accountsBond[0].owner.accountCash?.id;
        const accountBondInvestor = investor.accountsBond[0];
        const accountBondManager = funding.accountsBond[0];

        await context.prisma.$transaction([
          context.prisma.accountCash.update({
            where: {
              id: accountCashIdInvestor,
            },
            data: {
              balance: {
                increment: totalRefundAmount,
              },
              transactions: {
                create: {
                  amount: totalRefundAmount,
                  type: "DEPOSIT",
                  title: `${accountBondInvestor.funding?.title} 펀드 환불 금액`,
                },
              },
            },
          }),
          context.prisma.accountBond.update({
            where: {
              id: accountBondInvestor.id,
            },
            data: {
              balance: {
                decrement: accountBondInvestor.balance,
              },
              transactions: {
                create: {
                  amount: accountBondInvestor.balance,
                  title: `${accountBondInvestor.funding?.title} 펀드 취소`,
                  type: "WITHDRAW",
                },
              },
            },
          }),
          context.prisma.accountCash.update({
            where: { id: accountCashIdManager },
            data: {
              balance: { increment: fee },
              transactions: {
                create: {
                  amount: fee,
                  title: `${investor.name}님의 ${accountBondInvestor.funding?.title} 펀딩 취소 수수료`,
                  type: "DEPOSIT",
                },
              },
            },
          }),
          context.prisma.accountBond.update({
            where: { id: accountBondManager.id },
            data: {
              balance: {
                increment: accountBondInvestor.balance,
              },
              transactions: {
                create: {
                  amount: accountBondInvestor.balance,
                  title: `${investor.name}님의 ${accountBondInvestor.funding?.title} 펀딩 취소 채권`,
                  type: "DEPOSIT",
                },
              },
            },
          }),
        ]);

        return await context.prisma.accountCash.findUnique({
          where: { id: userId },
        });
      },
    });
    t.field("fundingSettlement", {
      type: "Funding",
      args: {
        amount: nonNull(intArg()),
        id: nonNull(intArg()),
      },
      async resolve(parent, { amount, id }, context, info) {
        const funding = await getFunding(context, id);
        const amountPerBalance = BigInt(
          amount / Number(funding?.bondsTotalNumber)
        );
        const FundingParticipantsAccountBond =
          await context.prisma.accountBond.findMany({
            select: {
              id: true,
              ownerId: true,
              settlementTransactions: true,
              balance: true,
            },
            where: {
              fundingId: id,
            },
          });
        const round =
          FundingParticipantsAccountBond[0].settlementTransactions.length;
        const settlementTransaction: any = [];
        FundingParticipantsAccountBond.forEach((participant) => {
          const settlementAmount = participant.balance * amountPerBalance;
          const additionalSettleMentAmount = settlementAmount / BigInt(10);
          settlementTransaction.push(
            context.prisma.user.update({
              where: {
                id: participant.ownerId,
              },
              data: {
                accountsBond: {
                  update: {
                    where: {
                      id: participant.id,
                    },
                    data: {
                      settlementTransactions: {
                        create: {
                          settlementAmount,
                          additionalSettleMentAmount,
                          round: round + 1,
                        },
                      },
                    },
                  },
                },
                accountCash: {
                  update: {
                    balance: {
                      increment: settlementAmount + additionalSettleMentAmount,
                    },
                  },
                },
              },
            })
          );
        });

        await context.prisma.$transaction(settlementTransaction);
        return await context.prisma.funding.findUnique({ where: { id } });
      },
    });
  },
});
