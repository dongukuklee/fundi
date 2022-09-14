import {
  arg,
  booleanArg,
  extendType,
  intArg,
  nonNull,
  objectType,
  stringArg,
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
    t.nonNull.string("title");
    t.field("images", {
      type: "Image",
      resolve(parent, args, context, info) {
        return context.prisma.bannerModule
          .findUnique({
            where: { id: parent.id },
          })
          .images();
      },
    });
    t.field("types", { type: "BannerTypes" });
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
        title: nonNull(stringArg()),
        types: nonNull(arg({ type: "BannerTypes" })),
        targetId: nonNull(intArg()),
        imageInput: "ImageInput",
        isVisible: nonNull(booleanArg()),
      },
      async resolve(
        parent,
        { title, types, targetId, imageInput, isVisible },
        context,
        info
      ) {
        if (!imageInput) throw new Error("image not found");
        const newBannerModule = await context.prisma.bannerModule.create({
          data: {
            title,
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
        return newBannerModule;
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
