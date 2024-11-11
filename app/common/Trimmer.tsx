import { useCallback, useEffect, useRef } from "react";

import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

export default function Trimmer({ selection, setSelection, duration, currentTime, setCurrentTime }: {
    selection: { start: number; end: number };
    setSelection: (selection: { start: number; end: number }) => void;
    duration: number;
    currentTime: number;
    setCurrentTime: (time: number) => void;
}) {
    const trimmerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggingHandle, setDraggingHandle] = useState<"left" | "right" | null>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [trimmerWidth, setTrimmerWidth] = useState<number>(0);

    useEffect(() => {
        if (trimmerRef.current) {
            setTrimmerWidth(trimmerRef.current.offsetWidth);
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (trimmerRef.current) {
                setTrimmerWidth(trimmerRef.current.offsetWidth);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const timeToPixels = (time: number) => (time / duration) * trimmerWidth;
    const pixelsToTime = (pixels: number) => (pixels / trimmerWidth) * duration;

    const handleMouseDown = useCallback((e: React.MouseEvent, handle: "left" | "right") => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDraggingHandle(handle);
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !draggingHandle || !trimmerRef.current) return;

            const rect = trimmerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;

            let newStart = selection.start;
            let newEnd = selection.end;

            if (draggingHandle === "left") {
                newStart = pixelsToTime(Math.max(0, Math.min(mouseX, timeToPixels(newEnd - 0.1))));
                if (newStart >= newEnd) newStart = newEnd - 0.1;
                setCurrentTime(newStart);
            } else {
                newEnd = pixelsToTime(Math.min(trimmerWidth, Math.max(mouseX, timeToPixels(newStart + 0.1))));
                if (newEnd <= newStart) newEnd = newStart + 0.1;
                setCurrentTime(newEnd);
            }

            setSelection({ start: newStart, end: newEnd });
        },
        [isDragging, draggingHandle, selection, trimmerWidth, timeToPixels, pixelsToTime, setSelection, setCurrentTime],
    );

    const updateCurrentTime = useCallback(
        (e: MouseEvent | React.MouseEvent) => {
            if (!trimmerRef.current) return;
            const rect = trimmerRef.current.getBoundingClientRect();
            const mouseX = "clientX" in e ? e.clientX - rect.left : 0;
            const clampedX = Math.max(0, Math.min(mouseX, trimmerWidth));
            const time = pixelsToTime(clampedX);
            setCurrentTime(time);
        },
        [trimmerWidth, pixelsToTime, setCurrentTime],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setDraggingHandle(null);
    }, []);

    const handleScrubMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsScrubbing(true);
            updateCurrentTime(e);
        },
        [updateCurrentTime],
    );

    const handleScrubMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isScrubbing) return;
            e.preventDefault();
            updateCurrentTime(e);
        },
        [isScrubbing, updateCurrentTime],
    );

    const handleScrubMouseUp = useCallback(() => {
        setIsScrubbing(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else if (isScrubbing) {
            window.addEventListener("mousemove", handleScrubMouseMove);
            window.addEventListener("mouseup", handleScrubMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mousemove", handleScrubMouseMove);
            window.removeEventListener("mouseup", handleScrubMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mousemove", handleScrubMouseMove);
            window.removeEventListener("mouseup", handleScrubMouseUp);
        };
    }, [isDragging, isScrubbing, handleMouseMove, handleMouseUp, handleScrubMouseMove, handleScrubMouseUp]);

    const leftWidth = timeToPixels(selection.start);
    const centerWidth = timeToPixels(selection.end - selection.start);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const playbackX = timeToPixels(currentTime);

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex flex-col">
                    <label className="text-sm text-light/70">Start Time</label>
                    <input
                        type="text"
                        value={formatTime(selection.start)}
                        onChange={(e) => {
                            const [min, sec] = e.target.value.split(':').map(Number);
                            const newTime = min * 60 + sec;
                            if (!isNaN(newTime) && newTime >= 0 && newTime < selection.end) {
                                setSelection({ ...selection, start: newTime });
                                setCurrentTime(newTime);
                            }
                        }}
                        className="bg-dark rounded px-2 py-1 text-light w-20"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm text-light/70">End Time</label>
                    <input
                        type="text"
                        value={formatTime(selection.end)}
                        onChange={(e) => {
                            const [min, sec] = e.target.value.split(':').map(Number);
                            const newTime = min * 60 + sec;
                            if (!isNaN(newTime) && newTime <= duration && newTime > selection.start) {
                                setSelection({ ...selection, end: newTime });
                                setCurrentTime(newTime);
                            }
                        }}
                        className="bg-dark rounded px-2 py-1 text-light w-20"
                    />
                </div>
                <div className="flex flex-col items-center mx-auto">
                    <label className="text-sm text-light/70">Current Time</label>
                    <span className="bg-panel-hover rounded px-2 py-1 text-white w-20 text-center">
                        {formatTime(currentTime)}
                    </span>
                </div>

                <div className="flex flex-col items-end ml-auto">
                    <span className="text-sm text-light/70">Clip Duration</span>
                    <span className="text-light">{formatTime(selection.end - selection.start)}</span>
                </div>
            </div>

            {/* Existing trimmer component */}
            <div className="bg-panel-hover relative h-12 cursor-pointer rounded" ref={trimmerRef} onMouseDown={handleScrubMouseDown}>
                {/* Selected Part */}
                <div
                    className="bg-accent absolute top-0 h-full"
                    style={{
                        left: `${leftWidth}px`,
                        width: `${centerWidth}px`,
                    }}
                >
                    {/* Left Slider */}
                    <div
                        className="bg-accent-hover absolute left-[-16px] top-0 flex h-full w-4 scale-110 cursor-col-resize items-center justify-center rounded-l-lg rounded-r transition-all hover:scale-125"
                        onMouseDown={(e) => handleMouseDown(e, "left")}
                        style={{ zIndex: 2 }}
                    >
                        <FaChevronLeft className="text-white" />
                    </div>

                    {/* Right Slider */}
                    <div
                        className="bg-accent-hover absolute right-[-16px] top-0 flex h-full w-4 scale-110 cursor-col-resize items-center justify-center rounded-l rounded-r-lg transition-all hover:scale-125"
                        onMouseDown={(e) => handleMouseDown(e, "right")}
                        style={{ zIndex: 2 }}
                    >
                        <FaChevronRight className="text-white" />
                    </div>
                </div>

                {/* Playback Position Marker */}
                <div
                    className="pointer-events-none absolute top-0 h-full w-1 bg-red-500"
                    style={{
                        left: `${playbackX}px`,
                        zIndex: 1,
                    }}
                ></div>
            </div>
        </div>
    );
}