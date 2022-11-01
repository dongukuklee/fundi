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
import { deleteImage } from "../../utils/imageDelete";
import { getCreateDateFormat, getLocalDate } from "../../utils/Date";

type ToReturnVariables = {
  types: BannerTypes;
  targetId: number;
  isVisible: boolean;
  images: any;
};

const makeBannerModuleVariables = (
  targetId?: number | null,
  isVisible?: boolean | null,
  types?: BannerTypes | null
) => {
  const variables = <ToReturnVariables>{};
  if (types) variables.types = types;
  if (targetId) variables.targetId = targetId;
  if (isVisible) variables.isVisible = isVisible;
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
            ...getCreateDateFormat(),
            title,
            targetId,
            types,
            images: {
              create: {
                ...getCreateDateFormat(),
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
      type: "Boolean",
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
        let images = {};
        const updateTransaction = [];
        const bannerModuleVariables = makeBannerModuleVariables(
          targetId,
          isVisible,
          types
        );
        if (imageInput) {
          images = {
            delete: true,
            create: {
              ...getCreateDateFormat(),
              ...imageInput!,
            },
          };
        }
        updateTransaction.push(
          context.prisma.bannerModule.update({
            where: {
              id,
            },
            data: {
              updatedAt: getLocalDate(),
              ...bannerModuleVariables,
              images,
            },
          })
        );
        try {
          await context.prisma.$transaction(updateTransaction);
          await deleteImage(context, { table: "banner", id });
          return true;
        } catch (error) {
          console.log(error);
          throw new Error("someting went wront");
        }
      },
    });
  },
});
