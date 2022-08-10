import { AccountBond, FundingStatus, Role, User } from "@prisma/client";
import {
  arg,
  extendType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from "nexus";
import { TransactionType } from "@prisma/client";
import { TAKE } from "../common/const";
import { Context } from "../context";
import { sortOptionCreator } from "../../utils/sortOptionCreator";

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
      status: true,
      title: true,
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
    t.list.field("artist", {
      type: "Artist",
      resolve(parent, args, context, info) {
        return context.prisma.artist.findMany({
          where: {
            fundings: {
              some: {
                fundingId: parent.id,
              },
            },
          },
        });
      },
    });
    t.field("contract", {
      type: "Contract",
      async resolve(parent, args, context, info) {
        return await context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .contract();
      },
    });
    t.dateTime("startDate");
    t.dateTime("endDate");
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
    t.nonNull.list.nonNull.field("accountInvestor", {
      type: "AccountBond",
      async resolve(parent, args, context, info) {
        // const { userRole } = context;
        // if (userRole !== Role.ADMIN && userRole !== Role.MANAGER) {
        //   throw new Error(
        //     "Only the manager and administrator can inquiry accounts of fundings."
        //   );
        // }
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
    t.list.field("likedUser", {
      type: "User",
      async resolve(parent, args, context, info) {
        const likedUsers = await context.prisma.funding
          .findUnique({
            where: {
              id: parent.id,
            },
          })
          .likedUser()
          .then((el) => {
            return el.map((data) => data.UserId);
          });
        return await context.prisma.user.findMany({
          where: {
            id: {
              in: likedUsers,
            },
          },
        });
      },
    });
    t.field("isLikedUser", {
      type: "Boolean",
      async resolve(parent, args, context, info) {
        const { userId } = context;
        if (!userId) {
          return false;
        }
        const likedUsers = await context.prisma.funding
          .findUnique({
            where: {
              id: parent.id,
            },
          })
          .likedUser()
          .then((el) => {
            return el.map((data) => data.UserId);
          });
        return likedUsers.includes(userId!);
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
        status: arg({ type: "FundingStatus" }),
        sort: stringArg(),
      },
      async resolve(parent, args, context, info) {
        const orderBy: any = sortOptionCreator(args.sort);
        const funding = await context.prisma.funding.findMany({
          where: {
            status: args?.status as FundingStatus | undefined,
          },
          orderBy,
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
        const myFunding = await context.prisma.funding.findMany({
          where: {
            accountsBond: {
              some: {
                ownerId: {
                  equals: userId,
                },
              },
            },
          },
        });
        return myFunding;
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

        if (!investor || !investor.accountCash) {
          throw new Error("Invalid user");
        }

        // 펀드 조회
        const funding = await getFunding(context, id);

        if (!funding || !funding.accountsBond) {
          throw new Error("Invalid funding");
        }

        //펀딩 모집기간이 아닌 경우.
        if (funding.status !== "PRE_CAMPAIGN") {
          throw new Error("funding is closed");
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
          await context.prisma.user.update({
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
          });
          investor = await getInvestor(context, id);
        }

        if (!investor || investor.accountsBond.length !== 1) {
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
                  accumulatedCash:
                    investor.accountCash?.balance! - investmentPrice,
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
                  accumulatedCash:
                    funding.accountsBond[0].owner.accountCash?.balance! +
                    investmentPrice,
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

        const accountCashIdInvestor = investor.accountCash?.id;
        const accountCashIdManager =
          funding.accountsBond[0].owner.accountCash?.id;
        const accountBondInvestor = investor.accountsBond[0];
        const accountBondManager = funding.accountsBond[0];
        let totalAmount: bigint, fee: bigint;
        if (funding.status === "PRE_CAMPAIGN") {
          //펀딩 시작 전 환불금액 100%
          totalAmount = funding.bondPrice * investor.accountsBond[0].balance;
          fee = BigInt(0);
        } else {
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

          //펀딩 정산 금액.
          const totalSettlementedAmount = settlementedAmount.reduce(
            (acc, cur) => acc + cur.settlementAmount,
            BigInt(0)
          );
          //환불 금액 (투자 원금 - 총 정산 금액)
          totalAmount =
            funding.bondPrice * investor.accountsBond[0].balance -
            totalSettlementedAmount;
          fee = (totalAmount / BigInt(10)) * BigInt(3);
        }

        //수수료  (투자 원금 - 총 정산 금액) 의 30%
        const totalRefundAmount = totalAmount - fee;
        //총 환불금액 (투자 원금 - 총 정산 금액) - 수수료

        const investorAccountCashUpdate = context.prisma.accountCash.update({
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
                accumulatedCash:
                  investor.accountCash?.balance + totalRefundAmount,
              },
            },
          },
        });
        const investorAccountBondUpdate = context.prisma.accountBond.update({
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
        });

        const managerAccountCashUpdate = context.prisma.accountCash.update({
          where: { id: accountCashIdManager },
          data: {
            balance: { decrement: totalRefundAmount },
            transactions: {
              create: {
                amount: totalRefundAmount,
                title: `${investor.name}님의 ${accountBondInvestor.funding?.title} 펀딩 취소 환불 금액`,
                type: "WITHDRAW",
                accumulatedCash:
                  funding.accountsBond[0].owner.accountCash?.balance! -
                  totalRefundAmount,
              },
            },
          },
        });
        const managerAccountBondUpdate = context.prisma.accountBond.update({
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
        });
        const withdrawFundingTransactions = [
          investorAccountCashUpdate,
          investorAccountBondUpdate,
          managerAccountCashUpdate,
          managerAccountBondUpdate,
        ];

        await context.prisma.$transaction(withdrawFundingTransactions);

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

        for (const participant of FundingParticipantsAccountBond) {
          const participantAccoutCash =
            await context.prisma.accountCash.findFirst({
              where: { ownerId: participant.ownerId },
              select: {
                balance: true,
              },
            });

          const settlementAmount = participant.balance * amountPerBalance;
          const additionalSettleMentAmount = settlementAmount / BigInt(10);
          const totalSettlementedAmount =
            settlementAmount + additionalSettleMentAmount;

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
                      increment: totalSettlementedAmount,
                    },
                    transactions: {
                      create: {
                        amount: totalSettlementedAmount,
                        title: `${funding?.title} 펀딩 ${
                          round + 1
                        }회차 정산금액.`,
                        type: "DEPOSIT",
                        accumulatedCash:
                          participantAccoutCash?.balance! +
                          totalSettlementedAmount,
                      },
                    },
                  },
                },
              },
            })
          );
        }

        await context.prisma.$transaction(settlementTransaction);
        return await context.prisma.funding.findUnique({ where: { id } });
      },
    });
    t.field("likeFunding", {
      type: "Funding",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        const { userId } = context;

        if (!userId) {
          throw new Error("Cannot liked Funding without signing in.");
        }
        const where = { id };
        const updateLikedFunding = async (likedUser: any) => {
          return await context.prisma.funding.update({
            where,
            data: {
              likedUser,
            },
          });
        };
        const userLikedInFunding = await context.prisma.funding.findUnique({
          where: {
            id,
          },
          select: {
            likedUser: true,
          },
        });

        let likedUser: any = {
          delete: {
            fundingId_UserId: {
              UserId: userId,
              fundingId: id,
            },
          },
        };
        const isExist = userLikedInFunding?.likedUser.every((el) => {
          return el.UserId !== userId;
        });
        if (isExist) {
          likedUser = {
            create: {
              UserId: userId,
            },
          };
        }
        return await updateLikedFunding(likedUser);
      },
    });
    t.field("createFunding", {
      type: "Funding",
      args: {
        title: nonNull(stringArg()),
        intro: stringArg({ default: "" }),
        bondPrice: intArg({ default: 10000 }),
        bondsTotalNumber: intArg({ default: 10000 }),
      },
      async resolve(parent, args, context, info) {
        const fundingVariables = {
          title: args.title!,
          intro: args.intro!,
          bondPrice: args.bondPrice!,
          bondsTotalNumber: args.bondsTotalNumber!,
        };

        return await context.prisma.funding.create({
          data: {
            ...fundingVariables,
          },
        });
      },
    });
    t.field("updateFunding", {
      type: "Funding",
      args: {
        id: nonNull(intArg()),
        title: stringArg(),
        intro: stringArg(),
        status: arg({ type: "FundingStatus" }),
        bondPrice: intArg({ default: 10000 }),
        bondsTotalNumber: intArg({ default: 10000 }),
      },
      async resolve(parent, { id, ...arg }, context) {
        const variables = {} as any;
        if (arg.title) {
          variables.title = arg.title;
        }
        if (arg.bondPrice) {
          variables.bondPrice = arg.bondPrice;
        }
        if (arg.bondsTotalNumber) {
          variables.bondsTotalNumber = arg.bondsTotalNumber;
        }
        if (arg.intro) {
          variables.intro = arg.intro;
        }

        if (arg.status) {
          variables.status = arg.status;
        }
        return await context.prisma.funding.update({
          where: {
            id,
          },
          data: {
            ...variables,
          },
        });
      },
    });
  },
});
