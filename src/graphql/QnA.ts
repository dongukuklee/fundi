import { QnATypes } from "@prisma/client";
import { arg, extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { AppPushAndCreateAlarm } from "../../utils/appPushAndCreateAlarm";
import { deleteImage } from "../../utils/imageDelete";

export const QnA = objectType({
  name: "QnA",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.boolean("isVisible");
    t.nonNull.field("type", { type: "QnATypes" });
    t.nonNull.int("userId");
    t.field("user", {
      type: "User",
      resolve(parent, args, context, info) {
        return context.prisma.qnA
          .findUnique({ where: { id: parent.id } })
          .user();
      },
    });
    t.string("title");
    t.string("content");
    t.string("reply");
    t.list.field("images", {
      type: "Image",
      resolve(parent, args, context, info) {
        return context.prisma.qnA
          .findUnique({ where: { id: parent.id } })
          .images();
      },
    });
  },
});

export const QnAQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("QnA", {
      type: "QnA",
      args: {
        id: nonNull(intArg()),
      },
      resolve(parent, { id }, context, info) {
        return context.prisma.qnA.findUnique({ where: { id } });
      },
    });
    t.list.field("myQnA", {
      type: "QnA",
      async resolve(parent, args, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error(
            "Cannot inquiry user information without signing in."
          );
        }
        return await context.prisma.qnA.findMany({
          where: { userId: userId },
          orderBy: {
            updatedAt: "desc",
          },
        });
      },
    });
    t.list.field("QnAs", {
      type: "QnA",
      async resolve(parent, args, context, info) {
        const { userRole } = context;
        // if (userRole !== "ADMIN") {
        //   throw new Error("Only the admin can inquiry user QnAs.");
        // }
        return await context.prisma.qnA.findMany({});
      },
    });
  },
});

export const QnAMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createQnA", {
      type: "QnA",
      args: {
        title: nonNull(stringArg()),
        content: nonNull(stringArg()),
        type: nonNull(arg({ type: "QnATypes" })),
        imageInput: "ImageInput",
      },
      async resolve(
        parent,
        { title, content, type, imageInput },
        context,
        info
      ) {
        const { userId } = context;
        if (!userId) {
          throw new Error("Cannot create Question without signing in.");
        }
        const defaultCreateData = {
          title,
          content,
          type,
          userId: userId,
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
        return await context.prisma.qnA.create({ data });
      },
    });
    t.field("replyQueation", {
      type: "QnA",
      args: {
        id: nonNull(intArg()),
        reply: nonNull(stringArg()),
      },
      async resolve(parent, { reply, id }, context, info) {
        const replyQueation = await context.prisma.qnA.update({
          where: { id },
          data: {
            status: "RESPONDED",
            reply,
          },
        });
        const user = await context.prisma.user.findUnique({
          where: { id: replyQueation.userId },
        });
        if (!user) throw new Error("user not found");

        await AppPushAndCreateAlarm(
          {
            title: `QnA 답변 등록.`,
            content: `${user.name} 님이 문의하신 내용에 대한 답변이 등록되었습니다.`,
            sentTime: new Date(),
            type: "QNA",
          },
          user.id,
          context
        );

        return replyQueation;
      },
    });
    t.field("updateQuestion", {
      type: "Boolean",
      args: {
        id: nonNull(intArg()),
        title: stringArg(),
        content: stringArg(),
        type: arg({ type: "QnATypes" }),
        imageInput: "ImageInput",
      },
      async resolve(
        parent,
        { id, title, content, type, imageInput },
        context,
        info
      ) {
        const updateTransaction = [];
        let images = {};
        if (imageInput) {
          // updateTransaction.push(
          //   context.prisma.image.deleteMany({
          //     where: { qnaId: id },
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
          context.prisma.qnA.update({
            where: { id },
            data: {
              title: title ? title : undefined,
              content: content ? content : undefined,
              type: type ? type : undefined,
              images,
            },
          })
        );
        try {
          await context.prisma.$transaction(updateTransaction);
          await deleteImage(context, { table: "qna", id });
          return true;
        } catch (error) {
          console.log(error);
          throw new Error("someting went wront");
        }
      },
    });
  },
});
