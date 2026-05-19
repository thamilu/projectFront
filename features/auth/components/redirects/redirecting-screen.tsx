'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';

/**
 * Premium Redirecting Screen
 * 
 * Featured with ultra-premium glassmorphism and animated mesh gradients
 * as per the [HARDEN] Design Core specifications.
 */
export function RedirectingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [-20, 20, -20],
            y: [-20, 20, -20],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            x: [20, -20, 20],
            y: [20, -20, 20],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -right-1/2 h-[200%] w-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent blur-3xl"
        />
      </div>

      {/* Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "relative z-10 w-full max-w-md p-8",
          "card-hardened bg-slate-900/65" // Overriding background color for dark mode premium feel
        )}
      >
        {/* High-contrast top border highlight */}
        <div className="gradient-emerald absolute inset-x-0 top-0 h-px opacity-50" />

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-16 w-16 rounded-full border-t-2 border-r-2 border-emerald-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-pulse text-emerald-400" />
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
            Redirecting to Secure Login
          </h1>
          <p className="text-slate-400">
            Please wait while we connect you to our authentication provider.
          </p>

          <div className="mt-8 flex w-full items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-emerald-500/50">
            <span className="h-px w-8 bg-emerald-500/20" />
            <span>Encrypted Connection</span>
            <span className="h-px w-8 bg-emerald-500/20" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
