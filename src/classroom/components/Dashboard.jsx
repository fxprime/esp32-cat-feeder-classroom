import React from "react";
import {
  Play,
  CheckCircle2,
  Circle,
  RotateCcw,
  Cpu,
  GitFork,
  Layers,
  Zap,
  Grid,
  Activity,
  Code2,
  Gamepad2,
  Terminal,
  Sparkles,
  BookOpen,
  ArrowRight,
  Monitor,
  Flame,
  Award,
} from "lucide-react";
import { CLASSROOM_GAME_URL, COURSE_TITLE, FEEDER_LAB_URL, LESSONS, PHASES } from "../data/lessons";

// Icon mapping helper
const ICONS = {
  Cpu,
  GitFork,
  Layers,
  Zap,
  Grid,
  Activity,
  Code2,
  Gamepad2,
  Terminal,
  Sparkles,
};

export default function Dashboard({
  completedSlides,
  onSelectSlide,
  onOpenResetModal,
  onContinueLearning,
}) {
  const completedCount = completedSlides.length;
  const totalCount = LESSONS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Find next uncompleted slide or fallback to slide 1
  const nextSlide =
    LESSONS.find((l) => !completedSlides.includes(l.id)) || LESSONS[0];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white selection:bg-cyan-500 selection:text-white">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-slate-800">
        {/* Glow backdrop effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top Pill & Class Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs sm:text-sm font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                สื่อการสอนแบบ Interactive สำหรับชั้นเรียน &amp; นักเรียน
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenResetModal}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
                aria-label="รีเซ็ตสถานะการเรียนทั้งหมด"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตความคืบหน้า</span>
              </button>
            </div>
          </div>

          {/* Main Title Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight text-balance">
                {COURSE_TITLE}
              </h1>

              <p className="text-base sm:text-lg text-cyan-300 leading-relaxed font-semibold">
                คอร์สเรียนรู้ ESP32 แบบ Project-Based Learning
              </p>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mt-1 mb-6">
                โดย วิทยากร ธนบดี บุหลันศรีชาติ
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onSelectSlide(nextSlide.id)}
                  type="button"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-cyan-500/25 transition transform active:scale-95 flex items-center gap-2.5 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>
                    {completedCount === 0
                      ? "เริ่มเรียนตั้งแต่สไลด์แรก"
                      : `เรียนต่อ: ${nextSlide.fullName}`}
                  </span>
                </button>

                <div className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>พร้อมโหมดเต็มจอ [F] สำหรับฉายขึ้นโปรเจกเตอร์</span>
                </div>
              </div>
            </div>

            {/* Progress & Stat Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                      ความคืบหน้าการเรียนรู้
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {completedCount} / {totalCount} ผ่านแล้ว
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3.5 bg-slate-700/70 rounded-full overflow-hidden mb-2 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 mb-4 font-mono">
                  <span>ความสำเร็จโดยรวม</span>
                  <span className="text-cyan-300 font-bold">
                    {progressPercent}%
                  </span>
                </div>

                {/* Quick Shortcuts List */}
                <div className="pt-3 border-t border-slate-700/70 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[11px] text-cyan-300">
                      ←
                    </span>
                    <span>สไลด์ก่อนหน้า</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-700 font-mono text-[11px] text-cyan-300">
                      →
                    </span>
                    <span>สไลด์ถัดไป</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Learning Phases & Slide Cards Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {PHASES.map((phase) => {
          const phaseLessons = LESSONS.filter((l) =>
            phase.slides.includes(l.id),
          );
          const phaseCompleted = phaseLessons.filter((l) =>
            completedSlides.includes(l.id),
          ).length;

          return (
            <section key={phase.id} className="space-y-5">
              {/* Phase Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-8 rounded-full bg-gradient-to-b ${phase.badgeColor}`}
                  />
                  <div>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                      {phase.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
                      {phase.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                  <span>สถานะช่วงนี้:</span>
                  <span
                    className={
                      phaseCompleted === phaseLessons.length
                        ? "text-emerald-400 font-bold"
                        : "text-cyan-400 font-bold"
                    }
                  >
                    {phaseCompleted} / {phaseLessons.length} เสร็จสิ้น
                  </span>
                </div>
              </div>

              {/* Slide Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {phaseLessons.map((lesson) => {
                  const isDone = completedSlides.includes(lesson.id);
                  const IconComponent = ICONS[lesson.icon] || Cpu;

                  return (
                    <a
                      key={lesson.id}
                      href={`#slide-${lesson.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        onSelectSlide(lesson.id);
                      }}
                      className={`group relative rounded-3xl p-5 bg-slate-800/80 hover:bg-slate-800 border transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                        isDone
                          ? "border-emerald-600/40 hover:border-emerald-500/70 shadow-emerald-950/20"
                          : "border-slate-700/80 hover:border-cyan-500/60 shadow-slate-950/40"
                      }`}
                    >
                      {/* Top Row: Slide number & Status */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-700/80 group-hover:bg-cyan-950 group-hover:text-cyan-300 text-slate-300 text-xs font-mono font-bold transition-colors">
                            สไลด์ #{lesson.slideNum}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-300 border border-slate-700/60">
                              {lesson.tag}
                            </span>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ผ่านแล้ว</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900/40 px-2 py-0.5 rounded-full">
                                <Circle className="w-3 h-3 text-slate-500" />
                                <span>ยังไม่เรียน</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Slide Title & Subtitle */}
                        <div className="flex items-start gap-3 mb-2.5">
                          <div
                            className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${lesson.gradient} p-2 text-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                              {lesson.title}
                            </h3>
                            <p className="text-xs text-cyan-400/90 font-medium">
                              {lesson.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                          {lesson.description}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-[11px] text-slate-400">
                          ⏱ {lesson.estMinutes}
                        </span>

                        <span className="inline-flex items-center gap-1 font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                          <span>เปิดสื่อการสอน</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <section className="max-w-xl mx-auto px-4 mb-5" aria-labelledby="course-references">
          <h2 id="course-references" className="mb-1.5 text-sm font-bold text-slate-300">แหล่งอ้างอิง</h2>
          <div className="flex flex-col items-center">
            {[
              { href: FEEDER_LAB_URL, label: "ESP32 Feeder Lab" },
              { href: CLASSROOM_GAME_URL, label: "ClassroomGame สำหรับนักเรียน" },
            ].map(({ href, label }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center px-3 font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-4">
                {label}
              </a>
            ))}
          </div>
        </section>
        <p className="max-w-xl mx-auto px-4">
          สื่อการเรียนรู้เชิงปฏิบัติการสำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4 •
          พัฒนาด้วย React, Vite &amp; Tailwind CSS
          <br />
          พร้อมระบบบันทึกความคืบหน้าอัตโนมัติบนเครื่องของคุณ (localStorage)
        </p>
      </footer>
    </div>
  );
}
