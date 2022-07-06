import { extendType, intArg, objectType } from "nexus";

export const Funding = objectType({
  name: "Funding",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
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
    t.nonNull.bigInt("bondTotalNumber");
    t.nonNull.field("status", { type: "FundingStatus" });
    t.field("accountBond", { type: "AccountBond" });
    t.nonNull.list.nonNull.field("artworks", {
      type: "Artwork",
      resolve(parent, args, context, info) {
        return context.prisma.funding
          .findUnique({ where: { id: parent.id } })
          .artworks();
      },
    });
  },
});

export const FundingQuery = extendType({
  type: "Query",
  definition(t) {
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
        const fundings = await context.prisma.user
          .findUnique({ where: { id: userId } })
          .fundings();
        return fundings;
      },
    });
  },
});
