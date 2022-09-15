import redisClient from "../index";

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
