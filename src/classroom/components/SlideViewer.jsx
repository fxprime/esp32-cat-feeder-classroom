import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Eye,
  Maximize,
  Minimize,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { LESSONS } from "../data/lessons";

export default function SlideViewer({
  slide,
  isNavHidden,
  onToggleNavHidden,
  isFullscreen,
  onToggleFullscreen,
  onGoHome,
  onPrevSlide,
  onNextSlide,
  canPrev,
  canNext,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // When slide changes, trigger brief smooth loading indicator
  useEffect(() => {
    setIsLoading(true);
  }, [slide.id]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  // Construct relative path as requested: ./slides/...?embed=1
  const slideSrc = `./slides/${slide.file}?embed=1`;

  return (
    <div className="relative flex-1 w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-800/90 text-cyan-300 border border-slate-700 shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="text-sm font-semibold text-slate-100">
              กำลังโหลด {slide.title}...
            </span>
          </div>
        </div>
      )}

      {/* Floating Teacher Controls Bar (Visible when navbar is hidden or in Fullscreen focus) */}
      {isNavHidden && (
        <div className="absolute top-3 right-4 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl transition-all duration-300 group hover:opacity-100 opacity-70">
          <button
            onClick={onToggleNavHidden}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
            aria-label="แสดงแถบเมนูด้านบน"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>แสดงเมนู</span>
          </button>

          <button
            onClick={onPrevSlide}
            disabled={!canPrev}
            type="button"
            className={`p-1.5 rounded-xl text-xs font-bold transition ${
              canPrev
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "text-slate-600 cursor-not-allowed"
            }`}
            aria-label="สไลด์ก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold font-mono px-1.5 text-cyan-300">
            {slide.slideNum}/{LESSONS.length}
          </span>

          <button
            onClick={onNextSlide}
            disabled={!canNext}
            type="button"
            className={`p-1.5 rounded-xl text-xs font-bold transition ${
              canNext
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "text-slate-600 cursor-not-allowed"
            }`}
            aria-label="สไลด์ถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          <button
            onClick={onToggleFullscreen}
            type="button"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label={isFullscreen ? "ย่อหน้าต่าง" : "เต็มหน้าจอ"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-amber-400" />
            ) : (
              <Maximize className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          <button
            onClick={onGoHome}
            type="button"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
            aria-label="กลับหน้าหลัก"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Slide Iframe */}
      <iframe
        key={iframeKey}
        src={slideSrc}
        aria-label={slide.title}
        onLoad={handleIframeLoad}
        className="w-full flex-1 border-0 h-full bg-white select-auto"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        sandbox={`allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads${slide.allowExternalTabs ? " allow-popups-to-escape-sandbox" : ""}`}
      />
    </div>
  );
}
