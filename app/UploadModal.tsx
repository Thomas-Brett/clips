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
import { getCategories } from "./lib/clips";

interface VideoClip {
    start: number;
    end: number;
}

type ClipData = {
    video?: Blob;
    thumbnail?: Blob;
    length?: number;
    clipName?: string;
    private?: boolean;
};

export default function UploadModal() {
    const router = useRouter();

    const { isOpen, setIsOpen } = useModal();

    const ffmpegRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [clip, setClip] = useState<VideoClip>({ start: 0, end: 0 });

    const [step, setStep] = useState<"select" | "trim" | "title" | "upload">("select");
    const [processing, setProcessing] = useState(false);
    const [clipData, setClipData] = useState<ClipData>({});

    const [allCategories, setAllCategories] = useState<{ name: string; id: string }[]>([]);

    const startProcessing = async () => {
        if (!videoSrc || !ffmpegRef.current) return;
        setProcessing(true);
        setStep("title");

        const data = await processVideo(ffmpegRef.current, videoSrc, clip);
        setClipData(data);
        setProcessing(false);
    };

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

        const getInitialCategories = async () => {
            const categories = await getCategories();
            setAllCategories(categories);
        };

        getInitialCategories();
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
                        <button onClick={handleClose} className="text-light hover:text-accent cursor-pointer transition-colors duration-200">
                            <FaXmark className="text-xl" />
                        </button>
                    </div>
                    <div className="px-8 py-4 pb-8">
                        {step === "select" && <VideoSelect fileInputRef={fileInputRef} setVideoSrc={setVideoSrc} setClip={setClip} setStep={setStep} />}
                        {step === "trim" && (
                            <ClipEditor
                                videoSrc={videoSrc!}
                                clip={clip}
                                setClip={setClip}
                                videoRef={videoRef}
                                handleClose={handleClose}
                                startProcessing={startProcessing}
                            />
                        )}
                        {step === "title" && <ClipTitle setStep={setStep} clipData={clipData} setClipData={setClipData} allCategories={allCategories} />}
                        {step === "upload" && <ClipUpload processing={processing} clipData={clipData} router={router} />}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function VideoSelect({
    fileInputRef,
    setVideoSrc,
    setClip,
    setStep,
}: {
    fileInputRef: any;
    setVideoSrc: (src: string) => void;
    setClip: (clip: VideoClip) => void;
    setStep: (step: "select" | "trim" | "title" | "upload") => void;
}) {
    const handleFileSelect = (file: File) => {
        if (file.type.startsWith("video/")) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setClip({ start: 0, end: 0 });
            setStep("trim");
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

    return (
        <div
            className="border-light hover:border-accent relative flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors duration-200"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
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
    videoRef,
    handleClose,
    startProcessing,
}: {
    videoSrc: string;
    clip: VideoClip;
    setClip: (clip: VideoClip) => void;
    videoRef: any;
    handleClose: () => void;
    startProcessing: () => void;
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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

    return (
        <>
            <div className="flex flex-col space-y-6">
                <div className="bg-primary-panel max-h-[700px] w-full overflow-hidden rounded-lg">
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
                <Button onClick={handleClose} transparent>
                    Cancel
                </Button>
                <Button
                    onClick={startProcessing}
                    disabled={!videoSrc}
                    customClasses="bg-accent hover:bg-accent-hover flex items-center justify-center rounded-lg px-4 py-2 text-lg font-bold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                </Button>
            </div>
        </>
    );
}

function ClipTitle({
    setStep,
    clipData,
    setClipData,
    allCategories,
}: {
    setStep: (step: "select" | "trim" | "title" | "upload") => void;
    clipData: ClipData;
    setClipData: (clipData: ClipData) => void;
    allCategories: { name: string; id: string }[];
}) {
    const [clipTitle, setClipTitle] = useState("");
    const [privateClip, setPrivateClip] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const startUpload = () => {
        if (!clipTitle) return;
        setClipData({ ...clipData, clipName: clipTitle, private: privateClip });
        setStep("upload");
    };

    return (
        <div className="flex flex-col space-y-4">
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

            <div className="ml-1 flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="private"
                    checked={privateClip}
                    onChange={(e) => setPrivateClip(e.target.checked)}
                    className="bg-secondary border-border focus:border-accent scale-150 rounded-sm border px-3 py-2 text-lg text-white transition-colors duration-200 focus:outline-hidden"
                />
                <label htmlFor="private" className="text-light font-semibold select-none">
                    Upload as private
                </label>
            </div>

            <div className="flex flex-col space-y-2">
                <label className="text-light text-lg font-bold">Categories</label>
                <div className="flex flex-wrap gap-2">
                    {allCategories &&
                        allCategories.map((category: { name: string; id: string }) => (
                            <div
                                key={category.id}
                                className={`bg-secondary border-border focus:border-accent rounded-sm border px-3 py-2 text-lg text-white transition-colors duration-200 focus:outline-hidden ${
                                    selectedCategories.includes(category.id) ? "bg-accent" : ""
                                }`}
                                onClick={() => {
                                    if (selectedCategories.includes(category.id)) {
                                        setSelectedCategories(selectedCategories.filter((id) => id !== category.id));
                                    } else {
                                        setSelectedCategories([...selectedCategories, category.id]);
                                    }
                                }}
                            >
                                {category.name}
                            </div>
                        ))}
                </div>
            </div>

            <Button onClick={startUpload} disabled={!clipTitle}>
                Upload
            </Button>
        </div>
    );
}

function ClipUpload({ processing, clipData, router }: { processing: boolean; clipData: ClipData; router: any }) {
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!processing && !uploading) {
            setUploading(true);
            uploadVideo(clipData, router);
        }
    }, [processing, uploading]);

    return (
        <div className="border-accent flex h-40 flex-col items-center justify-center rounded-lg border-2 transition-colors duration-200">
            <FaSpinner className="text-accent mb-4 animate-spin text-4xl" />
            <p className="text-light text-xl">{processing ? "Waiting on video to finish processing..." : uploading ? "Uploading..." : "Uploaded"}</p>
        </div>
    );
}

async function processVideo(ffmpeg: any, videoSrc: string, clip: VideoClip): Promise<ClipData> {
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
        const durationSeconds = clip.end - clip.start;

        await ffmpeg.deleteFile("input.mp4");
        await ffmpeg.deleteFile("output.mp4");
        await ffmpeg.deleteFile("thumbnail.jpg");

        return {
            video: trimmedBlob,
            thumbnail: thumbnailBlob,
            length: durationSeconds,
        };
    } catch (error) {
        console.error("Error processing video with FFmpeg:", error);
        await ffmpeg.deleteFile("input.mp4");
        await ffmpeg.deleteFile("output.mp4");
        await ffmpeg.deleteFile("thumbnail.jpg");
        alert("Failed to process video. Please try again.");
        throw error;
    }
}

async function uploadVideo(clipData: ClipData, router: any) {
    try {
        const formData = new FormData();
        formData.append("video", clipData.video as File);
        formData.append("thumbnail", clipData.thumbnail as File);
        formData.append("clipName", clipData.clipName as string);
        formData.append("length", clipData.length?.toString() as string);
        formData.append("private", clipData.private as unknown as string);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to upload video");
        }

        const responseData = await response.json();

        router.push(`/clip/${responseData.clipId}`);
    } catch (error) {
        console.error("Error uploading video:", error);
        alert("Failed to upload video. Please try again.");
    }
}
