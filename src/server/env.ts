import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1)
});

const storageEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_")
});

export function getDatabaseEnv() {
  return databaseEnvSchema.parse(process.env);
}

export function getStorageEnv() {
  return storageEnvSchema.parse(process.env);
}
