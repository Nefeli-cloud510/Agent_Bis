export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV !== "production") {
    return "postgres://postgres:postgres@127.0.0.1:55432/d_demo";
  }
  throw new Error("生产环境必须设置 DATABASE_URL");
}

let cachedSecret: string | undefined;

export function getAppSecret(): string {
  if (process.env.APP_SECRET) return process.env.APP_SECRET;
  if (process.env.NODE_ENV !== "production") {
    if (!cachedSecret) {
      cachedSecret = Buffer.from(
        `dev-only-${Math.random().toString(36).slice(2)}-${Date.now()}`
      ).toString("base64url");
    }
    return cachedSecret;
  }
  throw new Error("生产环境必须设置 APP_SECRET");
}

export function getCollectionPhase(): "dev" | "pilot" | "formal" {
  const value = process.env.COLLECTION_PHASE;
  if (value === "dev" || value === "pilot" || value === "formal") return value;
  if (process.env.NODE_ENV === "production") return "formal";
  return "dev";
}

export function allowGroupPreview(): boolean {
  if (process.env.ALLOW_GROUP_PREVIEW === "true") return true;
  return process.env.NODE_ENV !== "production";
}
