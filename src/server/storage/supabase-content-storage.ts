import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  ContentBucket,
  ContentStorage,
  UploadContentAssetInput
} from "@/server/storage/content-storage";
import { getStorageEnv } from "@/server/env";

const buckets: Array<{ id: ContentBucket; public: boolean }> = [
  { id: "content-public", public: true },
  { id: "content-private", public: false }
];

export class SupabaseContentStorage implements ContentStorage {
  private readonly client: SupabaseClient;

  constructor() {
    const env = getStorageEnv();
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async ensureBuckets(): Promise<void> {
    const { data, error } = await this.client.storage.listBuckets();
    if (error) {
      throw new Error(`Unable to list Supabase Storage buckets: ${error.message}`);
    }

    const existing = new Set(data.map((bucket) => bucket.id));
    for (const bucket of buckets) {
      if (existing.has(bucket.id)) {
        continue;
      }
      const { error: createError } = await this.client.storage.createBucket(bucket.id, {
        public: bucket.public,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]
      });
      if (createError) {
        throw new Error(`Unable to create ${bucket.id}: ${createError.message}`);
      }
    }
  }

  async upload(input: UploadContentAssetInput): Promise<void> {
    const { error } = await this.client.storage
      .from(input.bucket)
      .upload(input.objectKey, input.body, {
        contentType: input.contentType,
        cacheControl: input.cacheControl ?? "31536000",
        upsert: true
      });

    if (error) {
      throw new Error(`Unable to upload ${input.objectKey}: ${error.message}`);
    }
  }
}
