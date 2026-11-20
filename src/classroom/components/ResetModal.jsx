import React, { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
export default function ResetModal({ isOpen, onClose, onConfirm }) {
  const ref = useRef();
  useEffect(() => {
    if (isOpen && !ref.current.open) ref.current.showModal();
    else if (!isOpen && ref.current.open) ref.current.close();
  }, [isOpen]);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClose={onClose}
      aria-labelledby="reset-heading"
      className="max-w-md w-[calc(100%-2rem)] rounded-3xl bg-white p-6 shadow-2xl backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm"
    >
      <h2 id="reset-heading" className="text-xl font-bold text-slate-900 mb-3">
        รีเซ็ตความคืบหน้าทั้งหมด?
      </h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        ล้างสถานะเรียนแล้วทุกบทและเช็กลิสต์มิชชัน Wokwi บนอุปกรณ์นี้
        เพื่อเริ่มเรียนใหม่
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700"
        >
          <RotateCcw size={16} />
          ยืนยันรีเซ็ต
        </button>
      </div>
    </dialog>
  );
}
