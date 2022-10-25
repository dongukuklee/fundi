import redisClient from "../index";

//참조
//http://redisgate.kr/redis/introduction/redis_intro.php

const typeChecker = (value: any) => {
  return typeof value === "bigint"
    ? `BigInt:${value.toString()}`
    : JSON.stringify(value);
};

type ObjectAnyType = {
  [key: string]: any;
};

export const setString = async (
  key: string,
  data: string,
  EX?: number
): Promise<void> => {
  await redisClient.SET(key, JSON.stringify(data), { EX });
};

export const deleteString = async (key: string) => {
  await redisClient.DEL(key);
};

export const setHash = async (
  key: string,
  obj: ObjectAnyType
): Promise<void> => {
  const entries = Object.entries(obj);
  for (const [field, value] of entries) {
    const parsedValue = typeChecker(value);
    await redisClient.HSET(key, field, parsedValue);
  }
};

export const setHashValue = async (key: string, field: string, value: any) => {
  const parsedValue = typeChecker(value);
  await redisClient.HSET(key, field, parsedValue);
};

export const addToSet = async (key: string, value: string) => {
  return await redisClient.SADD(key, value);
};

export const removeFromSet = async (key: string, value: string) => {
  return await redisClient.SREM(key, value);
};

export const incrBy = async (key: string) => {
  return await redisClient.INCRBY(key, 1);
};

//list 를 Queue 로 사용하기 위함임.
export const listRightPush = async (key: string, element: any) => {
  const parsedElement =
    typeof element === "string" ? element : JSON.stringify(element);
  return await redisClient.RPUSH(key, parsedElement);
};

export const zAdd = async (key: string, score: number, value: string) => {
  return await redisClient.ZADD(key, { score, value });
};
