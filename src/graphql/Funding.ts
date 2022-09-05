import {
  AccountBond,
  ContractTypes,
  FundingStatus,
  Role,
  User,
} from "@prisma/client";
import {
  arg,
  extendType,
  inputObjectType,
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

export const FundingInput = inputObjectType({
  name: "FundingInput",
  definition(t) {
    t.nonNull.field("status", {
      type: "FundingStatus",
      default: "PRE_CAMPAIGN",
    });
    t.nonNull.string("title");
    t.string("intro");
    t.nonNull.boolean("isVisible");
    t.nonNull.string("startDate");
    t.nonNull.string("endDate");
  },
});
type Invester = User & {
  accountCash: {
    id: number;
    balance: bigint;
  } | null;
  accountsBond: (AccountBond & {
    funding: {
      title: string;
    } | null;
    settlementTransactions: {
      round: number;
    }[];
  })[];
};

type Funding = {
  bondPrice: bigint;
  bondsTotalNumber: bigint;
  contract: {
    lastYearEarning: bigint;
    terms: number;
    type: ContractTypes;
  };
  remainingBonds: bigint;
  status: FundingStatus;
  title: string;
  currentSettlementRound: number;
};
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
          settlementTransactions: {
            select: {
              round: true,
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
      currentSettlementRound: true,
      bondPrice: true,
      status: true,
      title: true,
      remainingBonds: true,
      contract: {
        select: { lastYearEarning: true, terms: true, type: true },
      },
    },
  });

  return funding;
};

const getTotalRefundAmount = (investor: Invester, funding: Funding) => {
  const investmentPrice = funding.bondPrice * investor.accountsBond[0].balance;
  const totalRefundAmount =
    funding.status === "PRE_CAMPAIGN"
      ? investmentPrice
      : BigInt(
          Math.ceil(
            ((Number(investmentPrice) *
              (funding.contract?.terms! - funding.currentSettlementRound)) /
              funding.contract?.terms!) *
              0.7
          )
        );

  return totalRefundAmount;
};

const getAmountPerBondWhenLoan = (amount: number, funding: Funding) => {
  const { bondsTotalNumber } = funding!;
  const avgIncome = Number(funding?.contract?.lastYearEarning!) / 12;
  const additionalIncome = amount - avgIncome;
  const additionalIncomeCheck = additionalIncome > 0;
  const additionalAmountPerBond = additionalIncomeCheck
    ? BigInt(Math.floor((additionalIncome * 0.24) / Number(bondsTotalNumber)))
    : BigInt(0);
  const amountPerBond = additionalIncomeCheck
    ? BigInt(Math.ceil((avgIncome * 0.3) / Number(bondsTotalNumber)))
    : BigInt(Math.ceil((amount * 0.3) / Number(bondsTotalNumber)));
  return { additionalAmountPerBond, amountPerBond };
};

const getAmountPerBondWhenOwnershipTransfer = (
  amount: number,
  funding: Funding
) => {
  const { bondsTotalNumber } = funding!;
  const amountPerBond = BigInt(
    Math.ceil((amount * 0.8) / Number(bondsTotalNumber))
  );
  return { additionalAmountPerBond: BigInt(0), amountPerBond };
};

const getAmountPerBond = (amount: number, funding: Funding) => {
  const { type } = funding.contract!;
  switch (type) {
    case "LOANS":
      return getAmountPerBondWhenLoan(amount, funding);
    case "OWENERSHIP_TRANSFER":
      return getAmountPerBondWhenOwnershipTransfer(amount, funding);
  }
};
export const Funding = objectType({
  name: "Funding",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.field("status", { type: "FundingStatus" });
    t.nonNull.string("title");
    t.nonNull.int("currentSettlementRound");
    t.list.field("fundingSettlement", {
      type: "FundingSettlement",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .fundingSettlement();
      },
    });
    t.list.field("images", {
      type: "Image",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .images();
      },
    });
    t.list.field("creator", {
      type: "Creator",
      resolve(parent, args, context, info) {
        return context.prisma.creator.findMany({
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
    t.nonNull.bigInt("remainingBonds");
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
            return el.map((data) => data.userId);
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
            return el.map((data) => data.userId);
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
        // 매니저의 채권 정보로 조회한다.
        const funding = await getFunding(context, id);

        if (!funding) {
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

        if (BigInt(amount) > funding.remainingBonds) {
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

        const investorAccountCashId = investor.accountCash?.id;
        const investorAccountBondId = investor.accountsBond[0].id;

        await context.prisma.$transaction([
          context.prisma.accountCash.update({
            where: {
              id: investorAccountCashId,
            },
            data: {
              balance: {
                decrement: investmentPrice,
              },
              transactions: {
                create: {
                  amount: investmentPrice,
                  title: `${funding.title} 펀딩 참여`,
                  type: TransactionType.WITHDRAW,
                  accumulatedCash:
                    investor.accountCash?.balance! - investmentPrice,
                },
              },
            },
          }),
          context.prisma.accountBond.update({
            where: {
              id: investorAccountBondId,
            },
            data: {
              balance: {
                increment: amount,
              },
              transactions: {
                create: {
                  amount: amount,
                  title: `${funding.title} 펀딩 참여`,
                  type: TransactionType.DEPOSIT,
                },
              },
            },
          }),
          context.prisma.funding.update({
            where: {
              id,
            },
            data: {
              remainingBonds: {
                decrement: amount,
              },
            },
          }),
        ]);

        return context.prisma.accountBond.findUnique({
          where: {
            id: investorAccountBondId,
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

        if (!funding) {
          throw new Error("Invalid funding");
        }

        const investorAccountCashId = investor.accountCash?.id;
        const accountBondInvestor = investor.accountsBond[0];

        const totalRefundAmount = getTotalRefundAmount(investor, funding);

        const investorAccountCashUpdate = context.prisma.accountCash.update({
          where: {
            id: investorAccountCashId,
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

        const withdrawFundingTransactions = [
          investorAccountCashUpdate,
          investorAccountBondUpdate,
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

        const { additionalAmountPerBond, amountPerBond } = getAmountPerBond(
          amount,
          funding!
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

        const round = funding?.currentSettlementRound!;
        const settlementTransaction: any = [];

        for (const participant of FundingParticipantsAccountBond) {
          const participantAccoutCash =
            await context.prisma.accountCash.findFirst({
              where: { ownerId: participant.ownerId },
              select: {
                balance: true,
              },
            });

          const settlementAmount = participant.balance * amountPerBond;
          const additionalSettleMentAmount =
            participant.balance * additionalAmountPerBond;
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
        return await context.prisma.funding.update({
          where: {
            id,
          },
          data: {
            currentSettlementRound: {
              increment: 1,
            },
            fundingSettlement: {
              create: {
                round: round + 1,
                monthlySettlementAmount: amount,
              },
            },
          },
        });
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
            fundingId_userId: {
              userId: userId,
              fundingId: id,
            },
          },
        };
        const isExist = userLikedInFunding?.likedUser.every((el) => {
          return el.userId !== userId;
        });
        if (isExist) {
          likedUser = {
            create: {
              userId: userId,
            },
          };
        }
        return await updateLikedFunding(likedUser);
      },
    });
    t.field("createFunding", {
      type: "Funding",
      args: {
        fundingInput: "FundingInput",
        contractId: nonNull(intArg()),
      },
      async resolve(parent, { fundingInput, contractId }, context, info) {
        const { endDate, isVisible, startDate, status, title } = fundingInput!;
        const bondPrice = 10000;
        const contract = await context.prisma.contract.findUnique({
          where: { id: contractId },
        });
        if (!contract) {
          throw new Error("contract not found");
        }
        const bondsTotalNumber = BigInt(
          Number(contract.fundingAmount) / bondPrice
        );

        return await context.prisma.funding.create({
          data: {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            title,
            bondsTotalNumber,
            remainingBonds: bondsTotalNumber,
            bondPrice,
            contract: {
              connect: {
                id: contractId,
              },
            },
            isVisible,
            status,
          },
        });
      },
    });
    t.field("updateFunding", {
      type: "Funding",
      args: {
        fundingInput: "FundingInput",
        fundingId: intArg(),
      },
      async resolve(parent, { fundingInput, fundingId: id }, context) {
        const { endDate, isVisible, startDate, status, title, intro } =
          fundingInput!;
        const variables = {} as any;
        if (!id) throw new Error("funding not found");

        if (title) variables.title = title;
        if (intro) variables.intro = intro;
        if (status) variables.status = status;
        if (endDate) variables.endDate = new Date(endDate);
        if (startDate) variables.startDate = new Date(startDate);
        if (isVisible !== undefined || isVisible !== null)
          variables.isVisible = isVisible;

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
