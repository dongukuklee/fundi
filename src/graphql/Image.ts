import { arg, extendType, intArg, nonNull, objectType } from "nexus";
import { getCreateDateFormat } from "../../utils/Date";

type ConnectType =
  | {
      connect: { id: number };
    }
  | undefined;

type ImageConnectType = {
  [type: string]: ConnectType;
  funding?: ConnectType;
  creator?: ConnectType;
  notice?: ConnectType;
  qna?: ConnectType;
};

export const Image = objectType({
  name: "Image",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.int("width");
    t.nonNull.int("height");
    t.nonNull.string("filename");
    t.nonNull.string("origin", {
      async resolve(parent, args, context, info) {
        const image = await context.prisma.image.findUnique({
          select: {
            path_origin: true,
          },
          where: { id: parent.id },
        });
        return image!.path_origin;
      },
    });
    t.nonNull.string("sq640", {
      async resolve(parent, args, context, info) {
        const image = await context.prisma.image.findUnique({
          select: {
            path_sq640: true,
          },
          where: { id: parent.id },
        });

        return image!.path_sq640;
      },
    });
    t.nonNull.string("w640", {
      async resolve(parent, args, context, info) {
        const image = await context.prisma.image.findUnique({
          select: {
            path_w640: true,
          },
          where: { id: parent.id },
        });

        return image!.path_w640;
      },
    });
    t.field("creator", {
      type: "Creator",
      resolve(parent, args, context, info) {
        return context.prisma.image
          .findUnique({ where: { id: parent.id } })
          .creator();
      },
    });
    t.field("funding", {
      type: "Funding",
      resolve(parent, args, context, info) {
        return context.prisma.image
          .findUnique({ where: { id: parent.id } })
          .funding();
      },
    });
    t.field("notice", {
      type: "Notice",
      resolve(parent, args, context, info) {
        return context.prisma.image
          .findUnique({ where: { id: parent.id } })
          .notice();
      },
    });
    t.field("qna", {
      type: "QnA",
      resolve(parent, args, context, info) {
        return context.prisma.image
          .findUnique({ where: { id: parent.id } })
          .qna();
      },
    });
  },
});

export const ImageMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createImage", {
      type: "Image",
      args: {
        createImageInput: "ImageInput",
        type: nonNull(arg({ type: "ImageTypes" })),
        id: nonNull(intArg()),
      },
      resolve(parent, { id, type, createImageInput }, context, info) {
        if (!createImageInput || !type || !id) throw new Error("");
        const connectAttr: ImageConnectType = { [type]: { connect: { id } } };
        return context.prisma.image.create({
          data: {
            ...connectAttr,
            ...createImageInput,
            ...getCreateDateFormat(),
          },
        });
      },
    });
  },
});
