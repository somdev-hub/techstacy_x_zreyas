"use client";
import { useLoginModal } from "@/context/LoginModalContext";
import { Login } from "./Login";

export function LoginModal() {
  const { isLoginOpen, closeLoginModal } = useLoginModal();

  if (!isLoginOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeLoginModal}
      />
      <div className="relative z-50 w-full max-w-md mx-4">
        <Login />
      </div>
    </div>
  );
}
