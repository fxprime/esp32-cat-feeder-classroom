import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Eye,
  Maximize,
  Minimize,
  Loader2,
} from "lucide-react";
import { LESSONS } from "../data/lessons";

const LOADER_DELAY_MS = 220;
const MAX_HOLD_MS = 2200;
const TRANSITION_CLEANUP_MS = 380;

export default function SlideViewer({
  slide,
  direction = "fade",
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
  const [{ active, outgoing }, setFrames] = useState(() => ({
    active: { slide, key: 0, direction, loaded: false },
    outgoing: null,
  }));
  const [loaderKey, setLoaderKey] = useState(null);

  useLayoutEffect(() => {
    setFrames((current) => {
      if (current.active.slide.id === slide.id) return current;
      return {
        active: { slide, key: current.active.key + 1, direction, loaded: false },
        outgoing: current.active.loaded ? current.active : current.outgoing,
      };
    });
  }, [slide, direction]);

  useEffect(() => {
    if (active.loaded) return;
    const timer = window.setTimeout(() => setLoaderKey(active.key), LOADER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active.key, active.loaded]);

  useEffect(() => {
    if (!outgoing) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = active.loaded ? (reduced ? 0 : TRANSITION_CLEANUP_MS) : MAX_HOLD_MS;
    const timer = window.setTimeout(() => {
      setFrames((current) => {
        if (current.active.key !== active.key || current.active.loaded !== active.loaded) return current;
        return { ...current, outgoing: null };
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active.key, active.loaded, outgoing]);

  function markReady(key) {
    setFrames((current) => {
      if (current.active.key !== key || current.active.loaded) return current;
      return { ...current, active: { ...current.active, loaded: true } };
    });
  }

  // A retained iframe stays in DOM order so its browsing context isn't reloaded.
  const layers = outgoing ? [outgoing, active] : [active];

  return (
    <div className="relative flex-1 w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      {!active.loaded && loaderKey === active.key && (
        <div className="absolute inset-0 z-20 grid place-items-center p-4 pointer-events-none">
          <div role="status" className="animate-badgeIn flex items-center gap-3 px-4 py-2 rounded-full bg-slate-800/95 text-cyan-300 border border-slate-700 shadow-xl">
            <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-100">
              กำลังโหลด {active.slide.title}
            </span>
          </div>
        </div>
      )}

      {/* Floating Teacher Controls Bar (Visible when navbar is hidden or in Fullscreen focus) */}
      {isNavHidden && (
        <div className="animate-floatBarIn absolute top-3 right-4 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl transition-opacity duration-300 group hover:opacity-100 opacity-70">
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

      {layers.map((frame) => {
        const isActive = frame.key === active.key;
        const interactive = isActive && active.loaded;
        let appearance = "hold";
        if (isActive) {
          if (active.loaded) appearance = `enter-${active.direction}`;
          else if (outgoing) appearance = "preload";
        } else if (active.loaded) {
          appearance = `exit-${active.direction}`;
        }

        return (
          <iframe
            key={frame.key}
            src={`./slides/${frame.slide.file}?embed=1`}
            title={frame.slide.title}
            data-slide-id={frame.slide.id}
            data-active-slide={isActive}
            data-slide-ready={interactive}
            inert={!interactive}
            aria-hidden={interactive ? undefined : true}
            tabIndex={interactive ? undefined : -1}
            onLoad={() => markReady(frame.key)}
            className={`slide-stage-frame slide-stage-${appearance} select-auto`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            sandbox={`allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads${frame.slide.allowExternalTabs ? " allow-popups-to-escape-sandbox" : ""}`}
          />
        );
      })}
    </div>
  );
}
