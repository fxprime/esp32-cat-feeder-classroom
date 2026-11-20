import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import SlideViewer from "./components/SlideViewer";
import ResetModal from "./components/ResetModal";
import { LESSONS } from "./data/lessons";
import { STORAGE_KEY, PREVIOUS_STORAGE_KEY, LEGACY_STORAGE_KEY, readProgress } from "./data/progress";

function slideFromHash() {
  const match = window.location.hash.match(/^#(?:slide-)?(\d+)$/);
  const id = Number(match?.[1]);
  return LESSONS.some((lesson) => lesson.id === id) ? id : null;
}

export default function App() {
  // Current active slide: null means Dashboard, otherwise a lesson ID.
  const [currentSlideId, setCurrentSlideId] = useState(slideFromHash);
  const slideIndex = LESSONS.findIndex((lesson) => lesson.id === currentSlideId);
  const currentSlide = LESSONS[slideIndex];
  const prevSlide = slideIndex > 0 ? LESSONS[slideIndex - 1] : undefined;
  const nextSlide = currentSlide ? LESSONS[slideIndex + 1] : undefined;

  // Completed slides array from localStorage
  const [completedSlides, setCompletedSlides] = useState(() => {
    try {
      return readProgress(localStorage);
    } catch (e) {
      console.warn("Failed to parse progress from localStorage", e);
    }
    return [];
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Sync state with URL Hash
  useEffect(() => {
    const handleHashChange = () => setCurrentSlideId(slideFromHash());

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.title = currentSlideId
      ? `${LESSONS.find((l) => l.id === currentSlideId)?.title} | ESP32 Classroom`
      : "ESP32 ม.4 · เครื่องให้อาหารแมว";
  }, [currentSlideId]);

  // Update hash when slide changes
  const navigateToSlide = useCallback((id) => {
    if (id === null) {
      window.location.hash = "";
      setCurrentSlideId(null);
    } else {
      window.location.hash = `#slide-${id}`;
      setCurrentSlideId(id);
      // Auto-record progress
      setCompletedSlides((prev) => {
        if (!prev.includes(id)) {
          const updated = [...prev, id];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        }
        return prev;
      });
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen error:", err);
    }
  };

  const toggleNavHidden = () => {
    setIsNavHidden((prev) => !prev);
  };

  // Toggle completed status manually
  const toggleCompleted = (id) => {
    setCompletedSlides((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Reset all progress
  const handleResetProgress = () => {
    setCompletedSlides([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PREVIOUS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem("esp32_classroom_wokwi_missions");
    } catch (e) {}
  };

  // Prev / Next slide navigation logic
  const handlePrevSlide = useCallback(() => {
    if (prevSlide) navigateToSlide(prevSlide.id);
  }, [prevSlide, navigateToSlide]);

  const handleNextSlide = useCallback(() => {
    if (nextSlide) navigateToSlide(nextSlide.id);
  }, [nextSlide, navigateToSlide]);

  // Keyboard navigation for teachers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing inside input / textarea
      const target = e.target;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isInput) return;

      if (e.key === "ArrowLeft") {
        handlePrevSlide();
      } else if (e.key === "ArrowRight") {
        handleNextSlide();
      } else if (e.key === "f" || e.key === "F") {
        if (currentSlideId !== null) {
          toggleFullscreen();
        }
      } else if (e.key === "Escape") {
        if (isNavHidden) {
          setIsNavHidden(false);
        }
      }
    };

    // Also handle postMessage forwarded from inside the slide iframe
    const handleMessage = (e) => {
      if (
        e.origin === window.location.origin &&
        e.source === document.querySelector("iframe")?.contentWindow &&
        e.data?.type === "SLIDE_NAV_KEY"
      ) {
        if (e.data.key === "ArrowLeft") {
          handlePrevSlide();
        } else if (e.data.key === "ArrowRight") {
          handleNextSlide();
        } else if (e.data.key?.toLowerCase() === "f") {
          toggleFullscreen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("message", handleMessage);
    };
  }, [handlePrevSlide, handleNextSlide, currentSlideId, isNavHidden]);

  const canPrev = Boolean(prevSlide);
  const canNext = Boolean(nextSlide);
  const isCurrentCompleted =
    currentSlideId !== null && completedSlides.includes(currentSlideId);

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-slate-900">
      {/* If in slide view and nav is not hidden, render Top Navigation Bar */}
      {currentSlide && !isNavHidden && (
        <Navbar
          currentSlide={currentSlide}
          onGoHome={() => navigateToSlide(null)}
          onPrevSlide={handlePrevSlide}
          onNextSlide={handleNextSlide}
          onSelectSlide={navigateToSlide}
          canPrev={canPrev}
          canNext={canNext}
          isCompleted={isCurrentCompleted}
          onToggleCompleted={toggleCompleted}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isNavHidden={isNavHidden}
          onToggleNavHidden={toggleNavHidden}
          onOpenResetModal={() => setIsResetModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      {currentSlide ? (
        <SlideViewer
          slide={currentSlide}
          isNavHidden={isNavHidden}
          onToggleNavHidden={toggleNavHidden}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onGoHome={() => navigateToSlide(null)}
          onPrevSlide={handlePrevSlide}
          onNextSlide={handleNextSlide}
          canPrev={canPrev}
          canNext={canNext}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <Dashboard
            completedSlides={completedSlides}
            onSelectSlide={navigateToSlide}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onContinueLearning={() => {
              const next =
                LESSONS.find((l) => !completedSlides.includes(l.id)) ||
                LESSONS[0];
              navigateToSlide(next.id);
            }}
          />
        </div>
      )}

      {/* Confirmation Modal for Resetting Progress */}
      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetProgress}
      />
    </div>
  );
}
