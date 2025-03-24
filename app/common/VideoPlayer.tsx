'use client';
import { useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause, FaExpand } from 'react-icons/fa';
import { IoMdVolumeHigh, IoMdVolumeOff } from 'react-icons/io';

interface VideoPlayerProps {
    src: string;
    poster: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    let hideControlsTimeout: NodeJS.Timeout;

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = Math.round(videoRef.current.currentTime * 100) / 100;
            setCurrentTime(current);
            setProgress(Math.round((current / duration) * 100));
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (progressRef.current && videoRef.current && duration > 0) {
            const rect = progressRef.current.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            const newTime = duration * clickPosition;
    
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
            setProgress(clickPosition * 100);
        }
    };
    
    

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (videoRef.current) {
            if (isMuted) {
                videoRef.current.volume = volume;
                setIsMuted(false);
            } else {
                videoRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            videoRef.current.requestFullscreen();
        }
    };

    useEffect(() => {
        const showControls = () => {
            setIsControlsVisible(true);
            clearTimeout(hideControlsTimeout);
            hideControlsTimeout = setTimeout(() => {
                if (isPlaying) {
                    setIsControlsVisible(false);
                }
            }, 2000);
        };

        const container = videoRef.current?.parentElement;
        container?.addEventListener('mousemove', showControls);
        container?.addEventListener('mouseleave', () => setIsControlsVisible(false));

        return () => {
            container?.removeEventListener('mousemove', showControls);
            container?.removeEventListener('mouseleave', () => setIsControlsVisible(false));
            clearTimeout(hideControlsTimeout);
        };
    }, [isPlaying]);

    return (
        <div className="relative w-full h-full group">
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={handlePlayPause}
            />
            
            <div className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div
                    ref={progressRef}
                    className="w-full h-1 bg-gray-600 cursor-pointer mb-4 relative"
                    onClick={handleProgressClick}
                >
                    <div
                        className="h-full bg-accent"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePlayPause}
                            className="text-white hover:text-gray-300"
                        >
                            {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleMute}
                                className="text-white hover:text-gray-300"
                            >
                                {isMuted ? <IoMdVolumeOff size={24} /> : <IoMdVolumeHigh size={24} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-24"
                            />
                        </div>

                        <div className="text-white text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <button
                        onClick={handleFullscreen}
                        className="text-white hover:text-gray-300"
                    >
                        <FaExpand size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
} 