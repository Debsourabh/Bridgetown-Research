"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** Counts from the previous value to the new one (e.g. 38 → 25 min). */
export function TweenNumber({ value, duration = 0.6 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(value);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const o = { v: last.current };
      last.current = value;
      if (o.v === value) {
        el.textContent = String(value);
        return;
      }
      gsap.to(o, {
        v: value,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = String(Math.round(o.v));
        },
      });
      gsap.fromTo(el, { color: "#2563eb" }, { color: "inherit", duration: 1.2, ease: "power1.out", clearProps: "color" });
    },
    { dependencies: [value] }
  );
  return <span ref={ref}>{value}</span>;
}
