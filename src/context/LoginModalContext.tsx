"use client";
import React, { createContext, useContext, useState } from "react";

interface LoginModalContextType {
  isLoginOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(
  undefined
);

export function LoginModalProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openLoginModal = () => {
    setIsLoginOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLoginModal = () => {
    setIsLoginOpen(false);
    document.body.style.overflow = "unset";
  };

  return (
    <LoginModalContext.Provider
      value={{ isLoginOpen, openLoginModal, closeLoginModal }}
    >
      {children}
    </LoginModalContext.Provider>
  );
}

export const useLoginModal = () => {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error("useLoginModal must be used within a LoginModalProvider");
  }
  return context;
};
