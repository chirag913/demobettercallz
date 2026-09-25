"use client";

import { useEffect, useRef, useState } from "react";

const whatsappUrl = `https://wa.me/918447355977?text=${encodeURIComponent("Hi, I just tried the BetterCallz demo and want to discuss using it for my leads.")}`;

export function WhatsAppLink() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [obscured, setObscured] = useState(true);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const button = ref.current?.getBoundingClientRect();
        if (!button) return;
        const controls = document.querySelectorAll('#demo form, #demo [role="status"], #demo [tabindex="-1"]');
        setObscured(Array.from(controls).some(control => {
          const rect = control.getBoundingClientRect();
          return button.left < rect.right + 12 && button.right > rect.left - 12 && button.top < rect.bottom + 12 && button.bottom > rect.top - 12;
        }));
      });
    };
    const observer = new ResizeObserver(check);
    const demo = document.getElementById("demo");
    if (demo) observer.observe(demo);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    window.visualViewport?.addEventListener("resize", check);
    check();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      window.visualViewport?.removeEventListener("resize", check);
    };
  }, []);

  return <a ref={ref} href={whatsappUrl} target="_blank" rel="noopener noreferrer"
    aria-label="Chat with BetterCallz on WhatsApp"
    style={{ visibility: obscured ? "hidden" : "visible", bottom: "calc(1rem + env(safe-area-inset-bottom))", right: "calc(1rem + env(safe-area-inset-right))" }}
    className="fixed z-30 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor">
      <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.47 0 .12 5.35.12 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.94 11.94 0 0 0 5.77 1.47h.01C18.63 23.83 24 18.48 24 11.9c0-3.18-1.24-6.17-3.48-8.42ZM12.05 21.8a9.87 9.87 0 0 1-5.03-1.37l-.36-.21-3.72.97.99-3.63-.24-.38a9.88 9.88 0 0 1-1.52-5.25c0-5.47 4.45-9.92 9.92-9.92a9.86 9.86 0 0 1 7.02 2.91 9.85 9.85 0 0 1 2.9 7.02c0 5.47-4.45 9.86-9.96 9.86Zm5.44-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
    <span className="hidden md:inline">Chat on WhatsApp</span>
  </a>;
}
