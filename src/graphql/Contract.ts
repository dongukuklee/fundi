import { objectType, intArg, stringArg, nonNull, arg } from "nexus";

export const Contract = objectType({
  name: "Contract",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.field("type", { type: "ContractTypes" });
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
    t.nonNull.int("terms");
    t.nonNull.dateTime("startDate");
    t.nonNull.dateTime("endDate");
    t.field("createContract", {
      type: "Contract",
      args: {
        lastYearEarning: nonNull(intArg()),
        startDate: nonNull(stringArg()),
        endDate: nonNull(stringArg()),
        terms: intArg({ default: 12 }),
      },
      resolve(
        parent,
        { lastYearEarning, endDate, startDate, terms },
        context,
        info
      ) {
        const amountRecieved = lastYearEarning / terms!;
        return context.prisma.contract.create({
          data: {
            lastYearEarning: BigInt(lastYearEarning!),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            terms,
            amountRecieved: BigInt(amountRecieved),
            type: "LOANS",
            funding: {
              create: {
                title: "1",
                status: "PRE_CAMPAIGN",
                currentSettlementRound: 0,
              },
            },
          },
        });
      },
    });
  },
});
