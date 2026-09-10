'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/shared/ui/atoms/dialog';
import { Keyboard } from 'lucide-react';

interface ShortcutOverlayProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutOverlay({ isOpen, onOpenChange }: ShortcutOverlayProps) {
  const shortcuts = [
    { key: '?', desc: 'Toggle keyboard shortcut overlay menu', category: 'General' },
    { key: 'Esc', desc: 'Dismiss active dialogs, dropdowns, or overlays', category: 'General' },
    { key: 'Ctrl + K / ⌘ + K', desc: 'Focus global search input box', category: 'General' },
    { key: 'Ctrl + B / ⌘ + B', desc: 'Expand or collapse sidebar navigation panel', category: 'Navigation' },
    { key: 'Ctrl + [1 - 6]', desc: 'Quickly navigate primary sidebar tabs (1-6)', category: 'Navigation' },
    { key: 'Ctrl + Shift + P', desc: 'Navigate directly to Store Profile page', category: 'Navigation' },
    { key: 'Ctrl + S', desc: 'Open seller settings panel', category: 'Navigation' },
    { key: 'Tab', desc: 'Rove focus forward to next interactive element', category: 'Accessibility' },
    { key: 'Shift + Tab', desc: 'Rove focus backward to previous interactive element', category: 'Accessibility' },
    { key: 'Arrow Up / Down', desc: 'Navigate vertically within sidebar menus', category: 'Accessibility' },
  ];

  // Group by category
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-lg rounded-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-500" />
            Seller Command Center Hotkeys
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Quick productivity shortcuts to navigate your seller panel without using the mouse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-3 max-h-[30rem] overflow-y-auto pr-1">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                {category} Shortcuts
              </h4>
              <div className="divide-y divide-slate-800/60 bg-slate-950/40 rounded-xl border border-slate-800/85 overflow-hidden">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between gap-4 p-3 hover:bg-slate-900/35 transition-colors text-xs"
                    >
                      <span className="text-slate-300 leading-relaxed font-medium">{shortcut.desc}</span>
                      <kbd className="shrink-0 bg-slate-800 text-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-700/80 font-mono text-[10px] font-semibold tracking-wider">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
