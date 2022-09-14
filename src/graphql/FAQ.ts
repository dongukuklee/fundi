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
import { FAQTypes } from "@prisma/client";

type ToReturnUpdateFAQDataType = {
  question?: string;
  answer?: string;
  type?: FAQTypes;
  isVisible?: boolean;
};

const makeUpdateFAQVariables = (
  question: string | undefined | null,
  answer: string | undefined | null,
  type: FAQTypes | undefined | null,
  isVisible: boolean | undefined | null
) => {
  const variables = <ToReturnUpdateFAQDataType>{};
  if (question) variables.question = question;
  if (answer) variables.answer = answer;
  if (type) variables.type = type;
  if (isVisible) variables.isVisible = isVisible;

  return variables;
};

export const FAQ = objectType({
  name: "FAQ",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.boolean("isVisible");
    t.nonNull.field("type", { type: "FAQTypes" });
    t.string("question");
    t.string("answer");
  },
});

export const FAQQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("FAQs", {
      type: "FAQ",
      args: {
        skip: intArg(),
        take: intArg(),
        type: arg({ type: "FAQTypes" }),
        keyword: stringArg(),
      },
      resolve(parent, args, context, info) {
        return context.prisma.fAQ.findMany({
          where: {
            type: args.type as FAQTypes | undefined,
            isVisible: true,
            OR: args.keyword
              ? [
                  {
                    answer: {
                      contains: args.keyword as string | undefined,
                    },
                  },
                  {
                    question: {
                      contains: args.keyword as string | undefined,
                    },
                  },
                ]
              : undefined,
          },
          skip: args?.skip as number | undefined,
          take: args?.take ? args.take : TAKE,
        });
      },
    });
  },
});

export const FAQMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createFAQ", {
      type: "FAQ",
      args: {
        question: nonNull(stringArg()),
        answer: nonNull(stringArg()),
        type: nonNull(arg({ type: "FAQTypes" })),
        isVisible: booleanArg(),
      },
      resolve(parent, { question, answer, type, isVisible }, context, info) {
        return context.prisma.fAQ.create({
          data: {
            question,
            answer,
            type,
            isVisible: isVisible ? true : false,
          },
        });
      },
    });
    t.field("updateFAQ", {
      type: "FAQ",
      args: {
        id: nonNull(intArg()),
        question: stringArg(),
        answer: stringArg(),
        type: arg({ type: "FAQTypes" }),
        isVisible: booleanArg(),
      },
      resolve(
        parent,
        { id, question, answer, type, isVisible },
        context,
        info
      ) {
        const data = makeUpdateFAQVariables(question, answer, type, isVisible);
        return context.prisma.fAQ.update({
          where: { id },
          data,
        });
      },
    });
  },
});
