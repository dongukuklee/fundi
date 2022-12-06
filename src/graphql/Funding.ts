import {
  AccountBond,
  ContractTypes,
  FundingStatus,
  Role,
  User,
} from "@prisma/client";
import { arg, extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { TransactionType } from "@prisma/client";
import { TAKE } from "../common/const";
import { Context } from "../context";
import { sortOptionCreator } from "../../utils/sortOptionCreator";
import { each, filter, map } from "underscore";
import { AppPushAndCreateAlarm } from "../../utils/appPushAndCreateAlarm";
import { deleteImage } from "../../utils/imageDelete";
import { signinCheck } from "../../utils/getUserInfo";
import { getCreateDateFormat, getLocalDate } from "../../utils/Date";
import axios from "axios";

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
    additionalFee: number;
    fundRasingRatio: number;
  };
  remainingBonds: bigint;
  status: FundingStatus;
  title: string;
  currentSettlementRound: number;
};

type DescriptionType = {
  id: number | undefined;
  title: string;
  content: string;
};
type CreateVariableType = {
  [key: string]: any;
  startDate?: Date;
  endDate?: Date;
  isVisible?: boolean;
  status?:
    | "PRE_CAMPAIGN"
    | "CAMPAIGNING"
    | "POST_CAMPAIGN"
    | "EARLY_CLOSING"
    | "END";
  title?: string;
};

type FundingInput = {
  startDate: string;
  endDate: string;
  isVisible: boolean;
  status:
    | "PRE_CAMPAIGN"
    | "CAMPAIGNING"
    | "POST_CAMPAIGN"
    | "EARLY_CLOSING"
    | "END";
  title: string;
};

const makeCreatorVariables = (data: FundingInput) => {
  const variables = <CreateVariableType>{};
  each(data, (el, idx) => {
    if (idx in ["startDate", "endDate"] && typeof el === "string") {
      variables[idx] = new Date(el);
    } else {
      variables[idx] = el;
    }
  });
  return variables;
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
        select: {
          lastYearEarning: true,
          terms: true,
          type: true,
          additionalFee: true,
          fundRasingRatio: true,
        },
      },
    },
  });

  return funding;
};

const getTotalRefundAmount = (investor: Invester, funding: Funding) => {
  const investmentPrice = funding.bondPrice * investor.accountsBond[0].balance;
  console.log(investmentPrice);
  const totalRefundAmount =
    funding.status === "CAMPAIGNING" || funding.status === "EARLY_CLOSING"
      ? investmentPrice
      : BigInt(
          Math.ceil(
            ((Number(investmentPrice) *
              (funding.contract?.terms! - funding.currentSettlementRound)) /
              funding.contract?.terms!) *
              0.7
          )
        );
  console.log(totalRefundAmount);
  return totalRefundAmount;
};

const getAmountPerBondWhenLoan = (amount: number, funding: Funding) => {
  const { bondsTotalNumber } = funding;
  //720
  const { contract } = funding;
  const { additionalFee, fundRasingRatio, lastYearEarning, terms, type } =
    contract;

  // (fundingRasingRatio/100 )/(terms/12)
  // 계약 기간에 따른 매 달 정산 비율
  const settlementRatio = (3 * fundRasingRatio) / (25 * terms);

  //매 달 평균 정산금 (계약 기간에 따라 변동)
  const avgIncome = (Number(lastYearEarning) * (fundRasingRatio / 100)) / terms;

  const additionalIncome = Math.floor(amount * settlementRatio) - avgIncome;
  const additionalIncomeCheck = additionalIncome > 0;
  const additionalAmountPerBond = additionalIncomeCheck
    ? BigInt(
        Math.floor(
          (additionalIncome * (additionalFee / 100)) / Number(bondsTotalNumber)
        )
      )
    : BigInt(0);

  const amountPerBond = additionalIncomeCheck
    ? BigInt(
        Math.ceil((avgIncome * settlementRatio) / Number(bondsTotalNumber))
      )
    : BigInt(Math.ceil((amount * settlementRatio) / Number(bondsTotalNumber)));
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
    t.list.field("description", {
      type: "FundingDescripton",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .description();
      },
    });
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
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .contract();
      },
    });
    t.dateTime("startDate");
    t.dateTime("endDate");
    t.nonNull.bigInt("bondPrice");
    t.nonNull.bigInt("bondsTotalNumber");
    t.nonNull.bigInt("remainingBonds");
    t.nonNull.bigInt("lastTransactionAmount");
    t.nonNull.list.nonNull.field("accountInvestor", {
      type: "AccountBond",
      resolve(parent, args, context, info) {
        // const { userRole } = context;
        // if (userRole !== Role.ADMIN && userRole !== Role.MANAGER) {
        //   throw new Error(
        //     "Only the manager and administrator can inquiry accounts of fundings."
        //   );
        // }
        return context.prisma.accountBond.findMany({
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
      resolve(parent, args, context, info) {
        const { userRole } = context;
        if (userRole !== Role.ADMIN && userRole !== Role.MANAGER) {
          throw new Error(
            "Only the manager and administrator can inquiry accounts of fundings."
          );
        }
        return context.prisma.accountBond.findFirst({
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
        return context.prisma.user.findMany({
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
    t.field("cancellationCharge", {
      type: "BigInt",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        const investor = await getInvestor(context, id);
        const funding = await getFunding(context, id);
        if (!investor) throw new Error("investor not found");
        if (!funding) throw new Error("funding not found");
        return await getTotalRefundAmount(investor, funding);
      },
    });
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

        return context.prisma.funding.findMany({
          where: {
            status: args?.status as FundingStatus | undefined,
          },
          orderBy,
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
        });
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
        signinCheck(userId);
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
      type: "Funding",
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
        if (funding.status !== "CAMPAIGNING") {
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

        const result = await context.prisma.$transaction([
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
        if (result[2].remainingBonds === BigInt(0)) {
          await context.prisma.funding.update({
            where: { id },
            data: { status: "EARLY_CLOSING" },
          });
        }
        return context.prisma.funding.findUnique({ where: { id } });
      },
    });
    t.field("withdrawFunding", {
      type: "AccountCash",
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
        const { status } = funding;
        const investorAccountCashId = investor.accountCash?.id;
        const investorAccountBond = investor.accountsBond[0];

        const totalRefundAmount = getTotalRefundAmount(investor, funding);

        const updateInvestorAccountCash = context.prisma.accountCash.update({
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
                title: `${investorAccountBond.funding?.title} 펀드 환불 금액`,
                accumulatedCash:
                  investor.accountCash?.balance + totalRefundAmount,
              },
            },
          },
        });

        const deleteInvestorAccountBond = context.prisma.accountBond.delete({
          where: { id: investorAccountBond.id },
        });
        const increaseFundingRemainingBone = context.prisma.funding.update({
          where: { id },
          data: {
            remainingBonds: {
              increment: investorAccountBond.balance,
            },
            status: status === "EARLY_CLOSING" ? "CAMPAIGNING" : status,
          },
        });
        const createTransactionBond = context.prisma.transactionBond.create({
          data: {
            accountId: investorAccountBond.id,
            amount: investorAccountBond.balance,
            title: `${investorAccountBond.funding?.title} 펀드 취소`,
            type: "WITHDRAW",
          },
        });

        const withdrawFundingTransactions = [
          updateInvestorAccountCash,
          deleteInvestorAccountBond,
          increaseFundingRemainingBone,
          createTransactionBond,
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
        const appPushTransaction: any = [];
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
          appPushTransaction.push(
            AppPushAndCreateAlarm(
              {
                title: `${funding?.title} 펀딩정산`,
                content: ` ${
                  round + 1
                }회차 정산금액 : ${totalSettlementedAmount} 원`,
                sentTime: new Date(),
                type: "FUNDING",
              },
              participant.ownerId,
              context
            )
          );
        }

        await context.prisma.$transaction(settlementTransaction);
        await Promise.all(appPushTransaction);
        console.log("done");
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
        imageInput: "ImageInput",
        contractId: nonNull(intArg()),
      },
      async resolve(
        parent,
        { fundingInput, contractId, imageInput },
        context,
        info
      ) {
        let { endDate, isVisible, startDate, status, title, description } =
          fundingInput!;
        const bondPrice = 10000;
        const contract = await context.prisma.contract.findUnique({
          where: { id: contractId },
        });
        if (!contract) throw new Error("contract not found");
        if (!imageInput) throw new Error("image data not found");
        if (!description) throw new Error("description not found");
        const bondsTotalNumber = BigInt(
          Number(contract.fundingAmount) / bondPrice
        );
        const typeParsedDescription = map(
          filter(description, (el) => !el.id),
          (el) => {
            const { content, title, id } = el;
            return <DescriptionType>{
              content,
              id,
              title,
            };
          }
        );
        const tmpEndDate = new Date(endDate);
        const createdFunding = await context.prisma.funding.create({
          data: {
            ...getCreateDateFormat(),
            startDate: new Date(startDate),
            endDate: tmpEndDate,
            title,
            bondsTotalNumber,
            remainingBonds: bondsTotalNumber,
            bondPrice,
            contract: {
              connect: {
                id: contractId,
              },
            },
            description: {
              createMany: {
                data: [...typeParsedDescription],
              },
            },
            isVisible,
            status,
            images: {
              create: {
                ...getCreateDateFormat(),
                ...imageInput,
              },
            },
          },
        });

        const backupSchedule = await context.prisma.schedulerBackUp.create({
          data: { endDate: tmpEndDate, fundingId: createdFunding.id },
        });
        axios.post("https://nu-art.kr/_admin_/setSchedule", {
          fundingId: createdFunding.id,
          endDate: tmpEndDate,
          backupScheduleId: backupSchedule.id,
        });
        return createdFunding;
      },
    });
    t.field("updateFunding", {
      type: "Boolean",
      args: {
        fundingInput: "FundingInput",
        fundingId: intArg(),
        imageInput: "ImageInput",
      },
      async resolve(
        parent,
        { fundingInput, fundingId: id, imageInput },
        context
      ) {
        const updateTransaction = [];
        let images = {};
        if (!id) throw new Error("funding not found");
        const fundingInputVariables = makeCreatorVariables(fundingInput!);
        if (fundingInput?.description) {
          each(fundingInput?.description, (el) => {
            updateTransaction.push(
              context.prisma.fundingDescription.upsert({
                where: { id: el.id! },
                update: { content: el.content, title: el.title },
                create: { content: el.content, title: el.title, fundingId: id },
              })
            );
          });
        }
        if (imageInput) {
          images = {
            delete: true,
            create: {
              ...imageInput!,
            },
          };
        }
        updateTransaction.push(
          context.prisma.funding.update({
            where: {
              id,
            },
            data: {
              updatedAt: getLocalDate(),
              ...fundingInputVariables,
              images,
            },
          })
        );

        try {
          await context.prisma.$transaction(updateTransaction);
          await deleteImage(context, { table: "funding", id });
          return true;
        } catch (error) {
          console.log(error);
          throw new Error("someting went wront");
        }
      },
    });
  },
});
