import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

interface RouteParams {
    params: Promise<{ clip_id: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { clip_id } = await params;
        if (!clip_id) {
            return new Response("Clip ID is required", { status: 400 });
        }

        const thumbnailPath = join(
            process.cwd(),
            "uploads",
            clip_id,
            "thumbnail.jpg"
        );

        const thumbnailBuffer = await readFile(thumbnailPath);

        return new Response(thumbnailBuffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=31536000",
            },
        });
    } catch (error) {
        console.error("Thumbnail fetch error:", error);
        return new Response("Failed to fetch thumbnail", { status: 500 });
    }
}
