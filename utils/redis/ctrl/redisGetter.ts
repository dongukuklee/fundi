import redisClient from "../index";

export async function getString(key: string): Promise<string> {
  return <string>await redisClient.get(key);
}
