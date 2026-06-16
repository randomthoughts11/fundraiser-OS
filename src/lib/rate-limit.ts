import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (!ratelimit && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "fundraise-os",
    });
  }
  return ratelimit;
}

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const limiter = getRatelimit();
  if (!limiter) return true;
  const { success } = await limiter.limit(identifier);
  return success;
}
