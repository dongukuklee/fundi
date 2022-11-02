import { arg, extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { TAKE } from "../common/const";
import { sortOptionCreator } from "../../utils/sortOptionCreator";
import { deleteImage } from "../../utils/imageDelete";
import { getCreateDateFormat, getLocalDate } from "../../utils/Date";

export const Notice = objectType({
  name: "Notice",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.boolean("isVisible");
    t.string("title");
    t.string("content");
    t.list.field("images", {
      type: "Image",
      resolve(parent, args, context, info) {
        return context.prisma.notice
          .findUnique({ where: { id: parent.id } })
          .images();
      },
    });
  },
});

export const NoticeQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("notice", {
      type: "Notice",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, { id }, context, info) {
        return await context.prisma.notice.findUnique({ where: { id } });
      },
    });
    t.list.field("notices", {
      type: "Notice",
      args: {
        skip: intArg(),
        take: intArg(),
        types: arg({ type: "NoticeTypes" }),
      },
      async resolve(parent, args, context, info) {
        const orderBy: any = sortOptionCreator("latest");
        return await context.prisma.notice.findMany({
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
          orderBy,
          where: { type: args?.types ? args?.types : "NOTICE" },
        });
      },
    });
  },
});

export const NoticeMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createNotice", {
      type: "Notice",
      args: {
        title: nonNull(stringArg()),
        content: nonNull(stringArg()),
        imageInput: "ImageInput",
        types: arg({ type: "NoticeTypes" }),
      },
      async resolve(
        parent,
        { title, content, imageInput, types },
        context,
        info
      ) {
        const defaultCreateData = {
          title,
          content,
          types,
          ...getCreateDateFormat(),
        };
        const data = !imageInput
          ? defaultCreateData
          : {
              ...defaultCreateData,
              images: {
                create: {
                  ...imageInput,
                },
              },
            };
        const notice = await context.prisma.notice.create({ data });

        return notice;
      },
    });
    t.field("updateNotice", {
      type: "Boolean",
      args: {
        id: nonNull(intArg()),
        title: stringArg(),
        content: stringArg(),
        imageInput: "ImageInput",
        types: arg({ type: "NoticeTypes" }),
      },
      async resolve(
        parent,
        { id, title, content, imageInput, types },
        context,
        info
      ) {
        const updateTransaction = [];
        let images = {};
        if (imageInput) {
          images = {
            delete: true,
            create: {
              ...imageInput!,
            },
          };
        }
        updateTransaction.push(
          context.prisma.notice.update({
            where: { id },
            data: {
              updatedAt: getLocalDate(),
              title: title ? title : undefined,
              content: content ? content : undefined,
              images,
            },
          })
        );
        try {
          await context.prisma.$transaction(updateTransaction);
          await deleteImage(context, { table: "notice", id });
          return true;
        } catch (error) {
          console.log(error);
          throw new Error("someting went wront");
        }
      },
    });
  },
});
