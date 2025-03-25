import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function POST(request: NextRequest) {
    try {
        const user = await getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const formData = await request.formData();
        const video = formData.get("video") as File;
        const thumbnail = formData.get("thumbnail") as File;
        const clipName = formData.get("clipName") as string;
        const lengthStr = formData.get("length") as string;

        if (!video || !thumbnail || !clipName || !lengthStr) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const length = Number(lengthStr);
        if (isNaN(length) || length <= 0) {
            return new Response(
                JSON.stringify({ error: "Invalid length value" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const clipId = await prisma.clips.create({
            data: {
                userId: user.id,
                title: clipName,
                length: Math.floor(length),
            },
        });

        const uploadDir = join(process.cwd(), "uploads", clipId.id);
        await mkdir(uploadDir, { recursive: true });

        const videoBuffer = Buffer.from(await video.arrayBuffer());
        await writeFile(join(uploadDir, "video.mp4"), videoBuffer);

        const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer());
        await writeFile(join(uploadDir, `thumbnail.jpg`), thumbnailBuffer);

        return new Response(
            JSON.stringify({ success: true, clipId: clipId.id }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error: any) {
        console.error("Upload error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to process upload" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
