import { objectType } from "nexus";

export const Image = objectType({
  name: "Image",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.int("width");
    t.nonNull.int("height");
    t.nonNull.string("filename");
    t.nonNull.string("path_origin");
    t.nonNull.string("path_w640");
    t.nonNull.string("path_sq640");
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
