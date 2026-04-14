"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    PlayIcon, 
    PauseIcon, 
    VolumeHighIcon, 
    VolumeMuteIcon,
    Maximize01Icon,
    Minimize01Icon
} from "@hugeicons/core-free-icons";

/**
 * Full-Screen Video Launcher with History Tracking.
 * Optimized for Phase 5: Zero-CPU Scrolling.
 */
export default React.memo(function AutoPauseVideo({ src, poster, className, onClick, ...props }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [posterUrl, setPosterUrl] = useState(poster);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [showPlayAnim, setShowPlayAnim] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const controlsTimeoutRef = useRef(null);

    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying && isFullScreen) setShowControls(false);
        }, 3000);
    };

    const enterFullScreen = () => {
        if (!containerRef.current) return;
        
        if (containerRef.current.requestFullscreen) {
            containerRef.current.requestFullscreen().catch(() => {});
        } else if (containerRef.current.webkitRequestFullscreen) {
            containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current.msRequestFullscreen) {
            containerRef.current.msRequestFullscreen();
        }
        
        // Push a dedicated history state to capture the hardware back button
        window.history.pushState({ isFullscreen: true, video: src }, "");
        
        setIsFullScreen(true);
        setHasStarted(true);
        setIsPlaying(true);
    };

    const exitFullScreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
        
        // If we still have the fullscreen state, pop it from history
        if (window.history.state?.isFullscreen) {
            window.history.back();
        }

        setIsFullScreen(false);
        setHasStarted(false);
        setIsPlaying(false);
    };

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        
        if (!isFullScreen) {
            enterFullScreen();
            return;
        }

        // If in FullScreen and controls are hidden, show them first
        if (!showControls) {
            resetControlsTimeout();
            return;
        }

        // If controls are already up, toggle play/pause
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(() => {});
                setIsPlaying(true);
                setShowPlayAnim('play');
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
                setShowPlayAnim('pause');
            }
            setTimeout(() => setShowPlayAnim(false), 500);
            resetControlsTimeout();
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const percent = parseFloat(e.target.value);
        if (videoRef.current) {
            const time = (percent / 100) * duration;
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    // Immersive View Sync & Hardware Back Button Support
    useEffect(() => {
        const handleFsChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullScreen(isFs);
            if (!isFs) {
                setHasStarted(false);
                setIsPlaying(false);
            }
        };

        const handlePopState = (e) => {
            // Close fullscreen if the user hit the hardware back button
            if (isFullScreen) {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                }
                setIsFullScreen(false);
                setHasStarted(false);
                setIsPlaying(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        window.addEventListener('popstate', handlePopState);

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isFullScreen]);

    useEffect(() => {
        if (isPlaying) resetControlsTimeout();
        else setShowControls(true);
        return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
    }, [isPlaying, isFullScreen]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative group cursor-pointer flex items-center justify-center transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[9999] bg-black' : 'rounded-[inherit] overflow-hidden bg-gray-100'}`}
            onClick={togglePlay}
            onMouseMove={resetControlsTimeout}
        >
            {hasStarted ? (
                <video
                    ref={videoRef}
                    src={src}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => { exitFullScreen(); }}
                    loop
                    className={`w-full h-full relative z-20 ${isFullScreen ? 'object-contain' : 'object-cover'}`}
                />
            ) : (
                posterUrl ? (
                    <img 
                        src={posterUrl} 
                        alt="Video thumbnail" 
                        className={`w-full h-full relative z-20 ${isFullScreen ? 'object-contain' : 'object-cover'}`}
                    />
                ) : (
                   <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10" />
                )
            )}

            {/* In-Feed Play Button Overlay */}
            {!isFullScreen && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ffc107] flex items-center justify-center shadow-2xl transform transition-all group-hover:scale-105 pointer-events-auto" onClick={togglePlay}>
                        <HugeiconsIcon icon={PlayIcon} className="w-8 h-8 sm:w-10 sm:h-10 text-black ml-1" />
                    </div>
                </div>
            )}

            {/* Play/Pause Center Animation (During FullScreen) */}
            {showPlayAnim && isFullScreen && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="p-5 rounded-full bg-black/40 backdrop-blur-sm animate-[ping_0.5s_ease-out_1]">
                        <HugeiconsIcon 
                            icon={showPlayAnim === 'play' ? PlayIcon : PauseIcon} 
                            className="w-12 h-12 text-white" 
                        />
                    </div>
                </div>
            )}

            {/* Minimalist Full-Screen-Only Overlay */}
            <div className={`absolute inset-0 flex flex-col justify-between z-30 transition-opacity duration-300 ${isFullScreen && (showControls || !isPlaying) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                
                <div className="p-4 flex justify-end">
                    <button 
                        onClick={(e) => { e.stopPropagation(); exitFullScreen(); }}
                        className="p-2.5 rounded-full bg-white/10 hover:bg-[#ffc107] hover:text-black backdrop-blur-md transition-all text-white border border-white/10 shadow-xl"
                    >
                        <HugeiconsIcon icon={Minimize01Icon} className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 pt-12 bg-gradient-to-t from-black/80 via-black/10 to-transparent">
                    <div className="flex flex-col gap-4">
                        {/* Scrubber */}
                        <div className="relative group/scrubber h-6 flex items-center px-1">
                            <div className="absolute left-1 right-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-[#ffc107] rounded-full transition-all duration-100 ease-linear" 
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                />
                            </div>
                            <input 
                                type="range" min="0" max="100" step="0.1"
                                value={(currentTime / duration) * 100 || 0}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                                className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg transition-transform scale-0 group-hover/scrubber:scale-100 pointer-events-none"
                                style={{ left: `calc(${(currentTime / duration) * 100}% - 7px)` }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button onClick={togglePlay} className="text-white hover:text-[#ffc107] transition-all transform active:scale-90">
                                    <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} className="w-7 h-7" />
                                </button>
                                
                                <button onClick={toggleMute} className="text-white hover:text-[#ffc107] transition-all transform active:scale-90">
                                    <HugeiconsIcon icon={isMuted ? VolumeMuteIcon : VolumeHighIcon} className="w-5.5 h-5.5" />
                                </button>

                                <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-bold tabular-nums">
                                    <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                                    <span className="opacity-40">/</span>
                                    <span className="opacity-60">{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
