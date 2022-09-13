import {
  arg,
  booleanArg,
  extendType,
  intArg,
  nonNull,
  objectType,
} from "nexus";
import { BannerTypes } from "@prisma/client";

type ToReturnVariables = {
  types: BannerTypes;
  targetId: number;
  isVisible: boolean;
  images: any;
};

const makeBannerModuleVariables = (
  targetId?: number | null,
  isVisible?: boolean | null,
  imageInput?: any | null,
  types?: BannerTypes | null
) => {
  const variables = <ToReturnVariables>{};
  if (types) variables.types = types;
  if (targetId) variables.targetId = targetId;
  if (isVisible) variables.isVisible = isVisible;
  if (imageInput) {
    variables.images = {
      delete: true,
      create: {
        ...imageInput!,
      },
    };
  }
  return variables;
};
export const BannerModule = objectType({
  name: "BannerModule",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.boolean("isVisible");
    t.field("images", {
      type: "Image",
      resolve(parent, args, context, info) {
        return context.prisma.bannerModule
          .findUnique({ where: { id: parent.id } })
          .images();
      },
    });
    t.field("type", { type: "BannerTypes" });
    t.int("targetId");
  },
});

export const BannerModuleQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("bannerModule", {
      type: "BannerModule",
      args: {
        id: nonNull(intArg()),
      },
      resolve(parent, { id }, context, info) {
        return context.prisma.bannerModule.findUnique({ where: { id } });
      },
    });
    t.list.field("bannerModules", {
      type: "BannerModule",
      resolve(parent, args, context, info) {
        return context.prisma.bannerModule.findMany({});
      },
    });
  },
});

export const BannerModuleMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createBannerModule", {
      type: "BannerModule",
      args: {
        types: nonNull(arg({ type: "BannerTypes" })),
        targetId: nonNull(intArg()),
        imageInput: "ImageInput",
        isVisible: nonNull(booleanArg()),
      },
      resolve(
        parent,
        { types, targetId, imageInput, isVisible },
        context,
        info
      ) {
        if (!imageInput) throw new Error("image not found");

        return context.prisma.bannerModule.create({
          data: {
            targetId,
            types,
            images: {
              create: {
                ...imageInput,
              },
            },
            isVisible,
          },
        });
      },
    });
    t.field("updateBannerModule", {
      type: "BannerModule",
      args: {
        id: nonNull(intArg()),
        types: arg({ type: "BannerTypes" }),
        targetId: intArg(),
        isVisible: booleanArg(),
        imageInput: "ImageInput",
      },
      async resolve(
        parent,
        { id, types, targetId, isVisible, imageInput },
        context,
        info
      ) {
        const data = makeBannerModuleVariables(
          targetId,
          isVisible,
          imageInput,
          types
        );
        return context.prisma.bannerModule.update({
          where: {
            id,
          },
          data,
        });
      },
    });
  },
});
