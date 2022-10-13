import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";
import { pick } from "underscore";
import { getLocalDate } from "../../utils/Date";
import { createVirtualAccount } from "../../utils/infinisoftModules";

type VirtualAccountType = {
  tid: string;
  goodsName: string;
  amt: string;
  moid: string;
  currency: string;
  buyerName: string;
  authDate: string;
  vbankNum: string;
  vbankBankNm: string;
  authId: number;
};

export const VirtualAccount = objectType({
  name: "VirtualAccount",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.dateTime("createdAt");
    t.nonNull.dateTime("updatedAt");
    t.nonNull.string("vbankExpDate");
    t.nonNull.string("tid");
    t.nonNull.string("goodsName");
    t.nonNull.string("amt");
    t.nonNull.string("moid");
    t.nonNull.string("currency");
    t.nonNull.string("buyerName");
    t.nonNull.string("authDate");
    t.nonNull.string("vbankNum");
    t.nonNull.string("vbankBankNm");
  },
});

export const VirtualAccountQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("getVirtualAccount", {
      type: "VirtualAccount",
      resolve(parent, args, context, info) {
        return context.prisma.virtualAccount.findFirst({ where: {} });
      },
    });
  },
});

export const VirtualAccountMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createVirtualAccount", {
      type: "VirtualAccount",
      args: { amt: nonNull(stringArg()) },
      async resolve(parent, { amt }, context, info) {
        const keys = [
          "tid",
          "goodsName",
          "amt",
          "moid",
          "currency",
          "buyerName",
          "authDate",
          "vbankNum",
          "vbankBankNm",
          "authId",
        ];

        const {
          data,
          vbankExpDate,
        }: { data: VirtualAccountType; vbankExpDate: string } =
          await createVirtualAccount(amt, context);
        const virtualAccountData: any = pick(data, ...keys);

        return await context.prisma.virtualAccount.create({
          data: {
            createdAt: getLocalDate(),
            updatedAt: getLocalDate(),
            vbankExpDate,
            ...virtualAccountData,
          },
        });
      },
    });
  },
});
