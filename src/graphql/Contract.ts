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

const makeContractVariable = (
  contractInput: any,
  transactionType: string,
  creatorId?: number
) => {
  const { lastYearEarning, startDate, endDate, terms, type } = contractInput;
  const fundingAmount = Math.floor((lastYearEarning * 0.3) / 10000) * 10000;
  const amountRecieved = fundingAmount * 0.9;
  let data = {
    ...contractInput,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    fundingAmount,
    amountRecieved,
  };
  switch (transactionType) {
    case "create":
      return {
        ...data,
        creator: {
          connect: {
            id: creatorId,
          },
        },
      };
    case "update":
      return data;
  }
};
export const ContractInput = inputObjectType({
  name: "ContractInput",
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
    t.field("creator", {
      type: "Creator",
      resolve(parent, args, context, info) {
        return context.prisma.contract
          .findUnique({ where: { id: parent.id } })
          .creator();
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
        contractInput: "ContractInput",
        creatorId: nonNull(intArg()),
      },
      resolve(parent, { contractInput, creatorId }, context, info) {
        if (!contractInput || !creatorId) {
          throw new Error("");
        }
        const data = makeContractVariable(contractInput, "create", creatorId);
        return context.prisma.contract.create({
          data,
        });
      },
    });
    t.field("updateContract", {
      type: "Contract",
      args: {
        contractInput: "ContractInput",
        contractId: nonNull(intArg()),
      },
      resolve(parent, { contractInput, contractId: id }, context, info) {
        const data = makeContractVariable(contractInput, "update");
        return context.prisma.contract.update({
          where: { id },
          data,
        });
      },
    });
  },
});
