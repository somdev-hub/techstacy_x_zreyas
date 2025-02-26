"use client";

import { useModal } from "@/context/ModalContext";
import { Signup } from "./Signup";

export function Modal() {
  const { isOpen, closeModal } = useModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="relative z-50 w-full max-w-md mx-4">
        <Signup />
      </div>
    </div>
  );
}
