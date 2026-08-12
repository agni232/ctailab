import { NextResponse } from "next/server";

import { AssetVisibility } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { resolvePublicAssetLocation } from "@/server/storage/content-asset-url";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ assetId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const { assetId } = await context.params;

  try {
    const asset = await prisma.contentAsset.findFirst({
      where: { id: assetId, visibility: AssetVisibility.PUBLIC },
      include: {
        locations: {
          where: { isPrimary: true },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
    const location = asset?.locations[0];

    if (!asset || !location) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    return NextResponse.redirect(resolvePublicAssetLocation(location), {
      status: 307,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable"
      }
    });
  } catch (error) {
    console.error("content-asset:read-failed", error);
    return NextResponse.json({ error: "Unable to load this asset." }, { status: 500 });
  }
}
