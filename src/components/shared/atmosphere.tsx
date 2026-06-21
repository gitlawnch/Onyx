"use client";
import { motion } from "framer-motion";

/** Ambient gradient glows + grid backdrop shared across all pages. */
export function Atmosphere() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <motion.div
          className="absolute -left-32 -top-56 h-[620px] w-[620px] rounded-full opacity-15 blur-[140px]"
          style={{ background: "radial-gradient(circle,#E8E1D2,transparent 65%)" }}
          animate={{ x: [0, 80, 0], y: [0, 60, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-44 top-36 h-[560px] w-[560px] rounded-full opacity-12 blur-[150px]"
          style={{ background: "radial-gradient(circle,#EDE3C7,transparent 65%)" }}
          animate={{ x: [0, -70, 0], y: [0, 90, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-72 left-1/3 h-[680px] w-[680px] rounded-full opacity-10 blur-[160px]"
          style={{ background: "radial-gradient(circle,#D6D0C5,transparent 68%)" }}
          animate={{ x: [0, 40, 0], y: [0, -70, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div
        className="bg-grid pointer-events-none fixed inset-0 -z-10 opacity-[0.03]"
        style={{
          maskImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%,#000 20%,transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%,#000 20%,transparent 75%)",
        }}
      />
    </>
  );
}
