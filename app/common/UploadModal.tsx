"use client";

import { FaXmark, FaVideo, FaPlay, FaPause, FaVolumeHigh, FaSpinner } from "react-icons/fa6";
import { useState, useRef, useEffect } from "react";
import Trimmer from "./Trimmer";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface VideoClip {
    start: number;
    end: number;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [clip, setClip] = useState<VideoClip>({ start: 0, end: 0 });
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [clipTitle, setClipTitle] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [ffmpeg, setFFmpeg] = useState<any>(null);
    const [isFFmpegReady, setIsFFmpegReady] = useState(false);

    const resetState = () => {
        setVideoSrc(null);
        setIsPlaying(false);
        setVolume(1);
        setCurrentTime(0);
        setDuration(0);
        setClip({ start: 0, end: 0 });
        setClipTitle("");
        setIsProcessing(false);
        setThumbnail(null);
        setIsSuccess(false);
        
        if (videoSrc) {
            URL.revokeObjectURL(videoSrc);
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const loadFFmpeg = async () => {
                try {
                    const origin = window.location.origin;
                    const ffmpegInstance = createFFmpeg({
                        log: true,
                        corePath: origin + "/ffmpeg-core.js",
                        wasmPath: origin + "/ffmpeg-core.wasm",
                        workerPath: origin + "/ffmpeg-core.worker.js",
                    });
                    await ffmpegInstance.load();
                    setFFmpeg(ffmpegInstance);
                    setIsFFmpegReady(true);
                } catch (error) {
                    console.error('Error loading FFmpeg:', error);
                    alert('Failed to load video processing capabilities');
                }
            };
            loadFFmpeg();
        }
    }, []);

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
                resetState();
            }
        }
    };

    const generateThumbnail = (video: HTMLVideoElement): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        });
    };

    const handleUpload = async () => {
        if (!ffmpeg || !videoSrc) return;

        setIsProcessing(true);

        ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoSrc));

        const startTime = clip.start.toFixed(2);
        const durationTime = (clip.end - clip.start).toFixed(2);

        await ffmpeg.run("-ss", startTime, "-i", "input.mp4", "-t", durationTime, "-c", "copy", "output.mp4");

        const data = ffmpeg.FS("readFile", "output.mp4");

        await ffmpeg.run("-i", "output.mp4", "-ss", "00:00:01.000", "-vframes", "1", "thumbnail.jpg");

        const thumbData = ffmpeg.FS("readFile", "thumbnail.jpg");

        const trimmedBlob = new Blob([data.buffer], { type: "video/mp4" });
        
        const thumbnailBlob = new Blob([thumbData.buffer], { type: "image/jpeg" });
        console.log(trimmedBlob);

        const formData = new FormData();
        formData.append("video", trimmedBlob, "trimmed-video.mp4");
        formData.append("thumbnail", thumbnailBlob, "thumbnail.jpg");
        formData.append("clipName", clipTitle);
        const durationSeconds = clip.end - clip.start;
        formData.append("length", String(durationSeconds));

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to upload video");
            }

            const data = await response.json();
            console.log("Video uploaded successfully!", data);
            setIsSuccess(true);
        } catch (error) {
            console.error("Error uploading video:", error);
            alert("Failed to upload video. Please try again.");
        }

        setIsProcessing(false);

        ffmpeg.FS("unlink", "input.mp4");
        ffmpeg.FS("unlink", "output.mp4");
        ffmpeg.FS("unlink", "thumbnail.jpg");
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
                onClick={handleClose}
            />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-panel rounded-lg shadow-lg z-50">
                <div className="flex items-center justify-between bg-dark p-6 rounded-t-lg">
                    <h2 className="text-light text-2xl font-bold">Upload and Trim Video</h2>
                    <button
                        onClick={handleClose}
                        className="text-light hover:text-accent transition-colors duration-200"
                    >
                        <FaXmark className="text-xl" />
                    </button>
                </div>
                <div className="px-8 pb-8 py-4">
                    {!videoSrc ? (
                        <div
                            className="flex flex-col items-center justify-center border-2 border-dashed border-light rounded-lg h-64 relative cursor-pointer hover:border-accent transition-colors duration-200"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FaVideo className="text-light text-4xl mb-4" />
                            <p className="text-light text-lg">Select Video</p>
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
                    ) : (
                        <>
                            <div className="flex flex-col space-y-6">
                                <div className="flex flex-col space-y-2">
                                    <label className="text-light font-bold text-lg">Clip Title</label>
                                    <input
                                        type="text"
                                        value={clipTitle}
                                        onChange={(e) => setClipTitle(e.target.value)}
                                        placeholder="Enter clip title..."
                                        className="bg-dark rounded px-3 py-2 text-lg text-white border border-border focus:border-accent focus:outline-none transition-colors duration-200"
                                    />
                                </div>
                                
                                <div className="w-full bg-dark rounded-lg overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        src={videoSrc}
                                        className="w-full"
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        controls={false}
                                    />
                                    <div className="flex items-center justify-between p-4">
                                        <button
                                            onClick={togglePlayPause}
                                            className="text-light hover:text-accent transition-colors duration-200"
                                        >
                                            {isPlaying ? <FaPause className="text-2xl" /> : <FaPlay className="text-2xl" />}
                                        </button>
                                        <div className="flex items-center space-x-2">
                                            <FaVolumeHigh className="text-light" />
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={volume}
                                                onChange={handleVolumeChange}
                                                className="w-24"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="w-full">
                                    <Trimmer
                                        selection={{ start: clip.start, end: clip.end }}
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
                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    onClick={handleClose}
                                    disabled={isProcessing}
                                    className="py-2 px-4 bg-transparent border border-white text-white rounded-lg hover:bg-panel-hover transition-colors duration-200 font-bold text-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleUpload();
                                    }}
                                    disabled={!videoSrc || !clipTitle.trim() || isProcessing || isSuccess || !isFFmpegReady}
                                    className="py-2 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors duration-200 font-bold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : isSuccess ? (
                                        <>
                                            ✓ Upload Complete
                                        </>
                                    ) : (
                                        'Upload'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
} 