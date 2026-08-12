export type ContentBucket = "content-public" | "content-private";

export interface UploadContentAssetInput {
  bucket: ContentBucket;
  objectKey: string;
  body: Uint8Array;
  contentType: string;
  cacheControl?: string;
}

export interface ContentStorage {
  ensureBuckets(): Promise<void>;
  upload(input: UploadContentAssetInput): Promise<void>;
}
