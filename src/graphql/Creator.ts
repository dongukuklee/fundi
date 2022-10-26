import {
  arg,
  booleanArg,
  extendType,
  intArg,
  nonNull,
  objectType,
  stringArg,
} from "nexus";

import { TAKE } from "../common/const";
import { sortOptionCreator } from "../../utils/sortOptionCreator";
import { each } from "underscore";
import { deleteImage } from "../../utils/imageDelete";
import { getCreateDateFormat, getLocalDate } from "../../utils/Date";

type CreateVariableType = {
  [key: string]: any;
  birthYear?: number;
  channelTitle?: string;
  channelUrl?: string;
  description?: string;
  isVisible?: boolean;
  name?: string;
};

type CreatorInput = {
  birthYear?: number | null | undefined;
  channelTitle?: string | null | undefined;
  channelUrl?: string | null | undefined;
  description?: string | null | undefined;
  isVisible?: boolean | null | undefined;
  name?: string | null | undefined;
};

const makeCreatorVariables = (data: CreatorInput) => {
  const variables = <CreateVariableType>{};
  each(data, (el, idx) => {
    variables[idx] = el;
  });
  return variables;
};
export const Creator = objectType({
  name: "Creator",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.string("name");
    t.nonNull.boolean("isVisible");
    t.nonNull.string("channelTitle");
    t.nonNull.string("channelUrl");
    t.nonNull.string("description");
    t.list.field("contract", {
      type: "Contract",
      resolve(parent, args, context, info) {
        return context.prisma.creator
          .findUnique({ where: { id: parent.id } })
          .contract();
      },
    });
    t.list.field("creatorMonthlyInfo", {
      type: "CreatorMonthlyInfo",
      async resolve(parent, args, context, info) {
        return await context.prisma.creatorMonthlyInfo.findMany({
          where: {
            creatorId: parent.id,
          },
          orderBy: {
            month: "desc",
          },
        });
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
    t.list.field("images", {
      type: "Image",
      resolve(parent, args, context, info) {
        return context.prisma.creator
          .findUnique({ where: { id: parent.id } })
          .images();
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
              updatedAt: getLocalDate(),
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
        imageInput: "ImageInput",
      },
      async resolve(parent, { creatorInput, imageInput }, context, info) {
        // if (context.userRole !== "ADMIN") {
        //   throw new Error("Only the administrator can create creator.");
        // }

        if (!creatorInput || !imageInput) throw new Error("");
        const creatorInputVariables = makeCreatorVariables(creatorInput);
        return await context.prisma.creator.create({
          data: {
            ...getCreateDateFormat(),
            ...creatorInputVariables,
            images: {
              create: {
                ...getCreateDateFormat(),
                ...imageInput,
              },
            },
          },
        });
      },
    });
    t.field("updateCreator", {
      type: "Boolean",
      args: {
        creatorInput: "CreatorInput",
        imageInput: "ImageInput",
        creatorId: nonNull(intArg()),
      },
      async resolve(
        parent,
        { creatorId: id, creatorInput, imageInput },
        context,
        info
      ) {
        // if (context.userRole !== "ADMIN") {
        //   throw new Error("Only the administrator can update creator.");
        // }
        const updateTransaction = [];
        let images = {};
        if (!creatorInput) throw new Error("");
        const creatorInputVariables = makeCreatorVariables(creatorInput);
        if (imageInput) {
          // updateTransaction.push(
          //   context.prisma.image.deleteMany({
          //     where: { creatorId: id },
          //   })
          // );
          images = {
            delete: true,
            create: {
              ...imageInput!,
            },
          };
        }

        updateTransaction.push(
          context.prisma.creator.update({
            where: {
              id,
            },
            data: {
              updatedAt: getLocalDate(),
              ...creatorInputVariables,
              images,
            },
          })
        );

        try {
          await context.prisma.$transaction(updateTransaction);
          await deleteImage(context, { table: "creator", id });
          return true;
        } catch (error) {
          console.log(error);
          throw new Error("someting went wront");
        }
      },
    });
  },
});
