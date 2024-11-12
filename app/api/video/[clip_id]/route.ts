import { NextRequest } from "next/server";
import { createReadStream, statSync } from "fs";
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

        const videoPath = join(process.cwd(), "uploads", clip_id, "video.mp4");
        const stat = statSync(videoPath);
        const fileSize = stat.size;
        const range = request.headers.get("range");

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;
            const stream = createReadStream(videoPath, { start, end });
            const streamData = await streamToBuffer(stream);

            return new Response(streamData, {
                status: 206,
                headers: {
                    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunkSize.toString(),
                    "Content-Type": "video/mp4",
                    "Cache-Control": "public, max-age=31536000",
                }
            });
        } else {
            const stream = createReadStream(videoPath);
            const streamData = await streamToBuffer(stream);

            return new Response(streamData, {
                headers: {
                    "Content-Length": fileSize.toString(),
                    "Content-Type": "video/mp4",
                    "Accept-Ranges": "bytes",
                    "Cache-Control": "public, max-age=31536000",
                }
            });
        }
    } catch (error) {
        console.error("Video fetch error:", error);
        return new Response("Failed to fetch video", { status: 500 });
    }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
} 