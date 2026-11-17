"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

type Props = {
  value: number;
  prefix?: string;
  className?: string;
};

const formatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export default function CountUp({ value, prefix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.textContent = prefix + formatter.format(value);
      return;
    }

    const state = { v: 0 };
    const animation = animate(state, {
      v: value,
      duration: 1100,
      ease: "outExpo",
      onUpdate: () => {
        el.textContent = prefix + formatter.format(Math.round(state.v));
      },
    });

    return () => {
      animation.pause();
      animation.cancel();
    };
  }, [value, prefix]);

  return (
    <span ref={ref} className={className}>
      {prefix + formatter.format(value)}
    </span>
  );
}
