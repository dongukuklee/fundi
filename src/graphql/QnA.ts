import { QnATypes } from "@prisma/client";
import { arg, extendType, intArg, nonNull, objectType, stringArg } from "nexus";

export const QnA = objectType({
  name: "QnA",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.boolean("isVisible");
    t.nonNull.field("type", { type: "QnATypes" });
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
  },
});

export const QnAQuery = extendType({
  type: "Query",
  definition(t) {
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
        });
      },
    });
    t.list.field("QnAs", {
      type: "QnA",
      async resolve(parent, args, context, info) {
        const { userRole } = context;
        if (userRole !== "ADMIN") {
          throw new Error("Only the admin can inquiry user QnAs.");
        }
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
      },
      async resolve(parent, { title, content, type }, context, info) {
        const { userId } = context;
        if (!userId) {
          throw new Error("Cannot create Question without signing in.");
        }
        return await context.prisma.qnA.create({
          data: {
            title,
            content,
            type,
            userId: userId,
          },
        });
      },
    });
    t.field("replyQueation", {
      type: "QnA",
      args: {
        id: nonNull(intArg()),
        reply: nonNull(stringArg()),
      },
      async resolve(parent, { reply, id }, context, info) {
        return await context.prisma.qnA.update({
          where: { id },
          data: {
            status: "RESPONDED",
            reply,
          },
        });
      },
    });
    t.field("updateQuestion", {
      type: "QnA",
      args: {
        id: nonNull(intArg()),
        title: stringArg(),
        content: stringArg(),
        type: arg({ type: "QnATypes" }),
      },
      async resolve(parent, { id, title, content, type }, context, info) {
        return await context.prisma.qnA.update({
          where: { id },
          data: {
            title: title ? title : undefined,
            content: content ? content : undefined,
            type: type ? type : undefined,
          },
        });
      },
    });
  },
});
