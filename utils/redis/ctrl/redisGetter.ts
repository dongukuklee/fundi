import { mapObject, reduce } from "underscore";
import redisClient from "../index";

//참조
//http://redisgate.kr/redis/introduction/redis_intro.php

const typeChecker = (field: string, val: any) => {
  const BigIntList = new Set([
    "balance",
    "amount",
    "accumulatedCash",
    "lastYearEarning",
    "fundingAmount",
    "amountRecieved",
    "bondPrice",
    "bondsTotalNumber",
    "remainingBonds",
    "monthlySettlementAmount",
    "settlementAmount",
    "additionalSettleMentAmount",
  ]);

  const DateTimeList = new Set([
    "createdAt",
    "updatedAt",
    "sentTime",
    "startDate",
    "endDate",
  ]);
  return BigIntList.has(field)
    ? BigInt(JSON.parse(val.split(":")[1]))
    : DateTimeList.has(field)
    ? new Date(JSON.parse(val))
    : JSON.parse(val);
};

export async function getString(key: string) {
  const data = await redisClient.get(key);
  if (!data) return null;
  return JSON.parse(data);
}

export const getHash = async (key: string) => {
  const result = await redisClient.HGETALL(key);
  const data = mapObject(result, (val, key) => {
    return typeChecker(key, val);
  });
  return data;
};

export const getHashValues = async (key: string, ...arg: any[]) => {
  const values = await redisClient.HMGET(key, arg);
  return reduce(
    values,
    (acc, value, idx) =>
      Object.assign(acc, { [arg[idx]]: typeChecker(arg[idx], value) }),
    {}
  );
};

export const getHashValue = async (key: string, field: string) => {
  const value = await redisClient.HGET(key, field);
  return typeChecker(field, value);
};

export const isInSet = async (key: string, value: string) => {
  return await redisClient.SISMEMBER(key, value);
};

export const getSet = async (key: string) => {
  return await redisClient.SMEMBERS(key);
};

//list 를 Queue 로 사용하기 위함임.
export const listLeftPop = async (key: string) => {
  return await redisClient.LPOP(key);
};

export const listLength = () => {};
