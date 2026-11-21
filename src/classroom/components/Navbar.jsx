import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  EyeOff,
  CheckCircle2,
  Circle,
  RotateCcw,
  ListFilter,
  Sparkles,
  Layers,
  Cpu,
  Monitor,
} from "lucide-react";
import { LESSONS, PHASES } from "../data/lessons";

export default function Navbar({
  currentSlide,
  onGoHome,
  onPrevSlide,
  onNextSlide,
  onSelectSlide,
  canPrev,
  canNext,
  isCompleted,
  onToggleCompleted,
  isFullscreen,
  onToggleFullscreen,
  isNavHidden,
  onToggleNavHidden,
  onOpenResetModal,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const progressPercent = Math.round(
    (currentSlide.slideNum / LESSONS.length) * 100,
  );

  return (
    <header className="relative bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white select-none shadow-md z-40 transition-all duration-300">
      {/* Top micro progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
        <div
          className="h-full w-full origin-left bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 progress-bar-smooth shadow-sm"
          style={{ transform: `scaleX(${progressPercent / 100})` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Brand & Home Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onGoHome}
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 hover:text-white border border-slate-700 transition font-medium text-xs sm:text-sm group"
            aria-label="กลับไปยังภาพรวมบทเรียน (Dashboard)"
          >
            <Home className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">หน้าหลัก (เมนูรวม)</span>
          </button>

          {/* Quick Dropdown Slide Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              type="button"
              className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs transition"
              aria-label="เลือกเปลี่ยนสไลด์ด่วน"
            >
              <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[150px] font-medium">
                สไลด์ทั้งหมด
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 border-b border-slate-700 flex justify-between">
                  <span>เลือกกระโดดไปยังสไลด์</span>
                  <span>1 - {LESSONS.length}</span>
                </div>
                <div className="max-h-80 overflow-y-auto py-1 space-y-1">
                  {LESSONS.map((item) => {
                    const active = item.id === currentSlide.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectSlide(item.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                          active
                            ? "bg-cyan-600 text-white font-bold"
                            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
                        }`}
                      >
                        <span className="truncate pr-2">{item.fullName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-cyan-700 text-cyan-100" : "bg-slate-700 text-slate-400"}`}
                        >
                          #{item.slideNum}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Slide Title & Navigation Arrows */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-center min-w-0 max-w-xl">
          {/* Previous Button */}
          <button
            onClick={onPrevSlide}
            disabled={!canPrev}
            type="button"
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 ${
              canPrev
                ? "bg-cyan-600/90 hover:bg-cyan-500 text-white shadow-sm hover:shadow-cyan-500/20"
                : "bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed"
            }`}
            aria-label="สไลด์ก่อนหน้า (หรือกดปุ่มลูกศรซ้าย ← บนคีย์บอร์ด)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">ก่อนหน้า</span>
          </button>

          {/* Current Slide Info Badge */}
          <div key={currentSlide.id} className="animate-badgeIn flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-0">
            <span className="text-xs sm:text-sm font-extrabold text-cyan-400 font-mono whitespace-nowrap">
              {currentSlide.slideNum} / {LESSONS.length}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[120px] sm:max-w-[220px] md:max-w-[280px]">
              {currentSlide.title}
            </span>
          </div>

          {/* Next Button */}
          <button
            onClick={onNextSlide}
            disabled={!canNext}
            type="button"
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 ${
              canNext
                ? "bg-cyan-600/90 hover:bg-cyan-500 text-white shadow-sm hover:shadow-cyan-500/20"
                : "bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed"
            }`}
            aria-label="สไลด์ถัดไป (หรือกดปุ่มลูกศรขวา → บนคีย์บอร์ด)"
          >
            <span className="hidden sm:inline">ถัดไป</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Completion Status, Fullscreen & Reset */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Completed Checkmark Toggle */}
          <button
            onClick={() => onToggleCompleted(currentSlide.id)}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
              isCompleted
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            }`}
            aria-label={
              isCompleted
                ? "เรียนผ่านแล้ว (คลิกเพื่อเปลี่ยนสถานะ)"
                : "คลิกเพื่อทำเครื่องหมายว่าเรียนผ่านแล้ว"
            }
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline">เรียนแล้ว</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-slate-400" />
                <span className="hidden lg:inline">ยังไม่จบ</span>
              </>
            )}
          </button>

          {/* Full Screen / Hide Menu Toggle */}
          <button
            onClick={onToggleFullscreen}
            type="button"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-semibold transition"
            aria-label={
              isFullscreen
                ? "ออกจากโหมดเต็มจอ"
                : "โหมดเต็มจอ (Full Screen) สำหรับฉายโปรเจกเตอร์"
            }
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">ย่อจอ</span>
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">เต็มจอ</span>
              </>
            )}
          </button>

          {/* Hide Nav / Focus Mode Button */}
          <button
            onClick={onToggleNavHidden}
            type="button"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white border border-slate-700 transition"
            aria-label="ซ่อนแถบเมนู (โหมดฉายเต็มพื้นที่)"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
