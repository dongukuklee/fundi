import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { TAKE } from "../common/const";
import { sortOptionCreator } from "../../utils/sortOptionCreator";

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
      },
      async resolve(parent, args, context, info) {
        const orderBy: any = sortOptionCreator("latest");
        return await context.prisma.notice.findMany({
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
          orderBy,
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
      },
      async resolve(parent, { title, content, imageInput }, context, info) {
        const defaultCreateData = {
          title,
          content,
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
      type: "Notice",
      args: {
        id: nonNull(intArg()),
        title: stringArg(),
        content: stringArg(),
      },
      async resolve(parent, { id, title, content }, context, info) {
        return await context.prisma.notice.update({
          where: { id },
          data: {
            title: title ? title : undefined,
            content: content ? content : undefined,
          },
        });
      },
    });
  },
});
