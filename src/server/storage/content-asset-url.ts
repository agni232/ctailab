import { AssetProvider } from "@/generated/prisma/client";

export interface PublicAssetLocation {
  provider: AssetProvider;
  bucket: string;
  objectKey: string;
}

export function contentAssetApiPath(assetId: string): string {
  return `/api/v1/assets/${encodeURIComponent(assetId)}`;
}

export function resolvePublicAssetLocation(location: PublicAssetLocation): string {
  if (location.provider === AssetProvider.SUPABASE_STORAGE) {
    const baseUrl = process.env.SUPABASE_URL;
    if (!baseUrl) {
      throw new Error("SUPABASE_URL is required to serve Supabase content assets.");
    }

    const bucket = encodeURIComponent(location.bucket);
    const objectKey = location.objectKey
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${objectKey}`;
  }

  throw new Error(`No public URL resolver is configured for ${location.provider}.`);
}
