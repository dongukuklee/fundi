import redisClient from "../index";

export async function setString(key: string, data: string, EX: number) {
  await redisClient.SET(key, JSON.stringify(data), { EX });
}
