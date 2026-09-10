'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/shared/ui/atoms/dialog';
import { Button } from '@/shared/ui/atoms/button';
import { Eye, EyeOff, GripVertical, Pin, RefreshCw } from 'lucide-react';

export interface WidgetConfig {
  id: string;
  name: string;
  visible: boolean;
  pinned: boolean;
  order: number;
}

interface WidgetCustomizerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: WidgetConfig[];
  onToggleVisibility: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onReset: () => void;
}

export function WidgetCustomizer({
  isOpen,
  onOpenChange,
  widgets,
  onToggleVisibility,
  onTogglePin,
  onMoveUp,
  onMoveDown,
  onReset
}: WidgetCustomizerProps) {
  // Sort by order so we display them in user layout sequence
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
            Customize Dashboard Layout
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Show, hide, prioritize, and reorder widgets to curate your customized workspace experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-3 max-h-[25rem] overflow-y-auto pr-1">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <span>Widget Name / Controls</span>
            <span>Pin & Order</span>
          </div>

          <div className="space-y-2.5">
            {sortedWidgets.map((widget, index) => (
              <div
                key={widget.id}
                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  widget.visible
                    ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-950/20 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4.5 w-4.5 text-slate-600 cursor-grab shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      {widget.name}
                      {widget.pinned && (
                        <span className="text-[9px] uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-1 py-0.2 rounded flex items-center gap-0.5">
                          <Pin className="h-2.5 w-2.5 fill-current" /> Pinned
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Eye Toggle visibility */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleVisibility(widget.id)}
                    className={`h-8 w-8 rounded-lg ${
                      widget.visible
                        ? 'text-indigo-400 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-500 hover:bg-slate-800'
                    }`}
                    aria-label={widget.visible ? `Hide ${widget.name}` : `Show ${widget.name}`}
                  >
                    {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>

                  {/* Pin button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTogglePin(widget.id)}
                    className={`h-8 w-8 rounded-lg ${
                      widget.pinned
                        ? 'text-amber-500 hover:bg-slate-800 hover:text-amber-400'
                        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                    aria-label={widget.pinned ? `Unpin ${widget.name}` : `Pin ${widget.name}`}
                  >
                    <Pin className={`h-4 w-4 ${widget.pinned ? 'fill-current' : ''}`} />
                  </Button>

                  {/* Order move triggers */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      disabled={index === 0}
                      onClick={() => onMoveUp(widget.id)}
                      className="text-[9px] font-bold text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Move widget up"
                    >
                      ▲
                    </button>
                    <button
                      disabled={index === sortedWidgets.length - 1}
                      onClick={() => onMoveDown(widget.id)}
                      className="text-[9px] font-bold text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Move widget down"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reset Action */}
        <div className="border-t border-slate-800 pt-4 flex justify-between gap-4 mt-3">
          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-white gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            Reset Layout
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            className="rounded-xl px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
