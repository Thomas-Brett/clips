"use client";

import { FaXmark, FaVideo, FaPlay, FaPause, FaVolumeHigh, FaSpinner } from "react-icons/fa6";
import { useState, useRef, useEffect } from "react";
import Trimmer from "./Trimmer";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { useModal } from "./context/modalContext";
import Button from "./components/primitives/Button";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface VideoClip {
    start: number;
    end: number;
}

export default function UploadModal() {
    const { isOpen, setIsOpen } = useModal();
    const ffmpegRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [isFFmpegReady, setIsFFmpegReady] = useState(false);
    const [clip, setClip] = useState<VideoClip>({ start: 0, end: 0 });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const loadFFmpeg = async () => {
                try {
                    const origin = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
                    const { FFmpeg } = await import("@ffmpeg/ffmpeg");

                    const ffmpegInstance = new FFmpeg();
                    const loadOptions = {
                        coreURL: await toBlobURL(`${origin}/ffmpeg-core.js`, "text/javascript"),
                        wasmURL: await toBlobURL(`${origin}/ffmpeg-core.wasm`, "application/wasm"),
                    };

                    await ffmpegInstance.load(loadOptions);

                    ffmpegRef.current = ffmpegInstance;
                    setIsFFmpegReady(true);
                } catch (error) {
                    console.error("Failed to load FFmpeg:", error);
                    alert("Failed to load video processing tools. Please refresh and try again.");
                }
            };

            loadFFmpeg();

            return () => {
                if (ffmpegRef.current) {
                    try {
                        ffmpegRef.current.terminate();
                    } catch (error) {
                        console.error("Error cleaning up FFmpeg:", error);
                    }
                }
            };
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
                onClick={(e) => {
                    e.stopPropagation();
                    if (e.target === e.currentTarget) {
                        handleClose();
                    }
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="bg-primary fixed top-1/2 left-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-lg"
                >
                    <div className="bg-secondary flex items-center justify-between rounded-t-lg p-4">
                        <h2 className="text-light text-2xl font-bold">Upload and Trim Video</h2>
                        <button onClick={handleClose} className="text-light hover:text-accent transition-colors duration-200">
                            <FaXmark className="text-xl" />
                        </button>
                    </div>
                    <div className="px-8 py-4 pb-8">
                        {!videoSrc ? (
                            <VideoSelect fileInputRef={fileInputRef} setVideoSrc={setVideoSrc} setClip={setClip} />
                        ) : (
                            <ClipEditor
                                videoSrc={videoSrc}
                                clip={clip}
                                setClip={setClip}
                                isFFmpegReady={isFFmpegReady}
                                ffmpegRef={ffmpegRef}
                                videoRef={videoRef}
                                handleClose={handleClose}
                            />
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function VideoSelect({ fileInputRef, setVideoSrc, setClip }: { fileInputRef: any; setVideoSrc: (src: string) => void; setClip: (clip: VideoClip) => void }) {
    const handleFileSelect = (file: File) => {
        if (file.type.startsWith("video/")) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setClip({ start: 0, end: 0 });
        } else {
            alert("Please select a valid video file.");
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div
            className="border-light hover:border-accent relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors duration-200"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
        >
            <FaVideo className="text-light mb-4 text-4xl" />
            <p className="text-light text-xl">Select Video</p>
            <input
                type="file"
                accept="video/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                    }
                }}
            />
        </div>
    );
}

function ClipEditor({
    videoSrc,
    clip,
    setClip,
    isFFmpegReady,
    ffmpegRef,
    videoRef,
    handleClose,
}: {
    videoSrc: string;
    clip: VideoClip;
    setClip: (clip: VideoClip) => void;
    isFFmpegReady: boolean;
    ffmpegRef: any;
    videoRef: any;
    handleClose: () => void;
}) {
    const router = useRouter();
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "uploading" | "success">("idle");
    const [clipTitle, setClipTitle] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (videoRef.current) {
            videoRef.current.volume = vol;
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            if (clip.end > 0 && videoRef.current.currentTime >= clip.end) {
                videoRef.current.currentTime = clip.start;
                if (isPlaying) {
                    videoRef.current.play();
                }
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const vidDuration = videoRef.current.duration;
            if (isFinite(vidDuration)) {
                setDuration(vidDuration);
                setClip({ start: 0, end: vidDuration });
            } else {
                alert("Could not determine video duration. Please try a different video.");
            }
        }
    };

    const handleUpload = async () => {
        if (!isFFmpegReady || !videoSrc || !ffmpegRef.current) return;
        const ffmpeg = ffmpegRef.current;

        setIsProcessing(true);
        setUploadStatus("processing");

        try {
            await ffmpeg.writeFile("input.mp4", await fetchFile(videoSrc));

            const startTime = clip.start.toFixed(2);
            const durationTime = (clip.end - clip.start).toFixed(2);

            await ffmpeg.exec(["-ss", startTime, "-i", "input.mp4", "-t", durationTime, "-c", "copy", "output.mp4"]);

            const data = await ffmpeg.readFile("output.mp4");

            await ffmpeg.exec(["-i", "output.mp4", "-ss", "00:00:01.000", "-vframes", "1", "thumbnail.jpg"]);

            const thumbData = await ffmpeg.readFile("thumbnail.jpg");

            const trimmedBlob = new Blob([data], { type: "video/mp4" });

            const thumbnailBlob = new Blob([thumbData], { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("video", trimmedBlob, "trimmed-video.mp4");
            formData.append("thumbnail", thumbnailBlob, "thumbnail.jpg");
            formData.append("clipName", clipTitle);
            const durationSeconds = clip.end - clip.start;
            formData.append("length", String(durationSeconds));

            setUploadStatus("uploading");

            try {
                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Failed to upload video");
                }

                const responseData = await response.json();
                console.log("Video uploaded successfully!", responseData);
                setIsSuccess(true);
                setUploadStatus("success");
                await ffmpeg.deleteFile("input.mp4");
                await ffmpeg.deleteFile("output.mp4");
                await ffmpeg.deleteFile("thumbnail.jpg");

                router.push(`/clip/${responseData.id}`);
            } catch (error) {
                await ffmpeg.deleteFile("input.mp4");
                await ffmpeg.deleteFile("output.mp4");
                await ffmpeg.deleteFile("thumbnail.jpg");
                console.error("Error uploading video:", error);
                alert("Failed to upload video. Please try again.");
                setUploadStatus("idle");
            }
        } catch (error) {
            console.error("Error processing video with FFmpeg:", error);
            alert("Failed to process video. Please try again.");
            setUploadStatus("idle");
        }

        setIsProcessing(false);
    };
    return (
        <>
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col space-y-2">
                    <label className="text-light text-lg font-bold">Clip Title</label>
                    <input
                        type="text"
                        value={clipTitle}
                        onChange={(e) => setClipTitle(e.target.value)}
                        placeholder="Enter clip title..."
                        className="bg-secondary border-border focus:border-accent rounded-sm border px-3 py-2 text-lg text-white transition-colors duration-200 focus:outline-hidden"
                    />
                </div>

                <div className="bg-primary-panel w-full overflow-hidden rounded-lg">
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        className="w-full"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        controls={false}
                    />
                    <div className="flex items-center justify-between p-4">
                        <button onClick={togglePlayPause} className="text-light hover:text-accent transition-colors duration-200">
                            {isPlaying ? <FaPause className="text-2xl" /> : <FaPlay className="text-2xl" />}
                        </button>
                        <div className="flex items-center space-x-2">
                            <FaVolumeHigh className="text-light" />
                            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-24" />
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <Trimmer
                        selection={{
                            start: clip.start,
                            end: clip.end,
                        }}
                        setSelection={(newSelection) => {
                            setClip(newSelection);
                        }}
                        duration={duration}
                        currentTime={currentTime}
                        setCurrentTime={(time) => {
                            if (videoRef.current) {
                                videoRef.current.currentTime = time;
                                setCurrentTime(time);
                            }
                        }}
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
                <Button onClick={handleClose} disabled={isProcessing} transparent>
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    disabled={!videoSrc || !clipTitle.trim() || isProcessing || isSuccess || !isFFmpegReady}
                    customClasses="bg-accent hover:bg-accent-hover flex items-center justify-center rounded-lg px-4 py-2 text-lg font-bold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {uploadStatus === "processing" ? (
                        <>
                            <FaSpinner className="mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : uploadStatus === "uploading" ? (
                        <>
                            <FaSpinner className="mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        "Upload"
                    )}
                </Button>
            </div>
        </>
    );
}
