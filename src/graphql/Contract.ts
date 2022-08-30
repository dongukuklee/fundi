import { ContractTypes } from "@prisma/client";
import {
  objectType,
  intArg,
  stringArg,
  nonNull,
  extendType,
  arg,
  inputObjectType,
} from "nexus";

export const ContranctInput = inputObjectType({
  name: "ContranctInput",
  definition(t) {
    t.nonNull.int("lastYearEarning");
    t.nonNull.int("terms");
    t.nonNull.string("startDate");
    t.nonNull.string("endDate");
    t.nonNull.field("type", { type: "ContractTypes" });
  },
});

export const Contract = objectType({
  name: "Contract",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.field("funding", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.contract
          .findUnique({ where: { id: parent.id } })
          .funding();
      },
    });
    t.nonNull.bigInt("lastYearEarning");
    t.nonNull.bigInt("amountRecieved");
    t.nonNull.field("type", { type: "ContractTypes" });
    t.nonNull.int("terms");
    t.nonNull.dateTime("startDate");
    t.nonNull.dateTime("endDate");
  },
});

export const ContractMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createContract", {
      type: "Contract",
      args: {
        contractInput: "ContranctInput",
        fundingInput: "FundingInput",
        creatorId: nonNull(intArg()),
      },
      resolve(
        parent,
        { contractInput, fundingInput, creatorId },
        context,
        info
      ) {
        if (!contractInput || !fundingInput || !creatorId) {
          throw new Error("");
        }
        const {
          lastYearEarning,
          startDate: contractStartDate,
          endDate: contractEndDate,
          terms,
          type,
        } = contractInput;
        const {
          bondPrice,
          bondsTotalNumber,
          startDate: fundingStartDate,
          endDate: fundingEndDate,
          title,
          status,
        } = fundingInput;
        const amountRecieved = lastYearEarning / terms;
        return context.prisma.contract.create({
          data: {
            lastYearEarning,
            startDate: new Date(contractStartDate),
            endDate: new Date(contractEndDate),
            terms,
            type,
            creator: {
              connect: {
                id: creatorId,
              },
            },
            amountRecieved,
            funding: {
              create: {
                title,
                startDate: new Date(fundingStartDate),
                endDate: new Date(fundingEndDate),
                bondPrice,
                bondsTotalNumber,
                remainingBonds: bondsTotalNumber,
                status: status!,
              },
            },
          },
        });
      },
    });
  },
});
