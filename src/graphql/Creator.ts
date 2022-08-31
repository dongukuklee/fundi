import {
  arg,
  booleanArg,
  extendType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
  inputObjectType,
} from "nexus";
import { TAKE } from "../common/const";
import { CreatorInvestmentPoint } from "./CreatorInvestmentPoint";
import { sortOptionCreator } from "../../utils/sortOptionCreator";

export const CreatorInput = inputObjectType({
  name: "CreatorInput",
  definition(t) {
    t.nonNull.string("name");
    t.nonNull.int("birthYear");
    t.nonNull.string("channelTitle");
    t.nonNull.string("channelUrl");
    t.nonNull.boolean("isVisible");
  },
});

export const Creator = objectType({
  name: "Creator",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("name");
    t.nonNull.boolean("isVisible");
    t.nonNull.string("description");
    t.list.field("contract", {
      type: "Contract",
      resolve(parent, args, context, info) {
        return context.prisma.creator
          .findUnique({ where: { id: parent.id } })
          .contract();
      },
    });
    t.int("birthYear");
    t.nonNull.list.nonNull.field("fundings", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.funding.findMany({
          where: {
            isVisible: true,
            creator: {
              every: {
                creatorId: parent.id,
              },
            },
          },
        });
      },
    });
    t.list.field("likedUser", {
      type: "User",
      async resolve(parent, args, context, info) {
        const likedUsers = await context.prisma.creator
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
        const likedUsers = await context.prisma.creator
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

export const CreatorQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("creator", {
      type: "Creator",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        return await context.prisma.creator.findUnique({ where: { id } });
      },
    });
    t.nonNull.list.nonNull.field("creators", {
      type: "Creator",
      args: {
        skip: intArg(),
        take: intArg(),
        sort: stringArg(),
        isVisible: booleanArg(),
      },
      async resolve(parent, args, context, info) {
        const orderBy: any = sortOptionCreator(args.sort);
        return await context.prisma.creator.findMany({
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
          orderBy,
          //where: { isVisible: true },
        });
      },
    });
  },
});

export const CreatorMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("likeCreator", {
      type: "Creator",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        const { userId } = context;
        const where = { id };
        const updateLikedCreator = async (likedUser: any) => {
          return await context.prisma.creator.update({
            where,
            data: {
              likedUser,
            },
          });
        };

        if (!userId) {
          throw new Error("Cannot liked Creator without signing in.");
        }

        const userLikedInFunding = await context.prisma.creator.findUnique({
          where,
          select: {
            likedUser: true,
          },
        });

        const isExist = userLikedInFunding?.likedUser.every((el) => {
          return el.userId !== userId;
        });

        let likedUser: any = {
          delete: {
            creatorId_userId: {
              creatorId: id,
              userId: userId,
            },
          },
        };
        if (isExist) {
          likedUser = {
            create: {
              userId: userId,
            },
          };
        }
        return await updateLikedCreator(likedUser);
      },
    });
    t.field("createCreator", {
      type: "Creator",
      args: {
        creatorInput: "CreatorInput",
      },
      async resolve(parent, { creatorInput }, context, info) {
        // if (context.userRole !== "ADMIN") {
        //   throw new Error("Only the administrator can create creator.");
        // }
        if (!creatorInput) throw new Error("");

        return await context.prisma.creator.create({
          data: {
            ...creatorInput,
          },
        });
      },
    });
    t.field("updateCreator", {
      type: "Creator",
      args: {
        creatorInput: "CreatorInput",
        creatorId: nonNull(intArg()),
      },
      async resolve(parent, { creatorId: id, creatorInput }, context, info) {
        // if (context.userRole !== "ADMIN") {
        //   throw new Error("Only the administrator can update creator.");
        // }
        if (!creatorInput) throw new Error("");

        return await context.prisma.creator.update({
          where: {
            id,
          },
          data: {
            ...creatorInput,
          },
        });
      },
    });
  },
});
