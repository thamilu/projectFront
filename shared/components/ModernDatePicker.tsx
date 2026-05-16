"use client";

import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, setMonth, setYear } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModernDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ModernDatePicker({ value, onChange, placeholder = "Select Date", disabled, className }: ModernDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(value ? new Date(value) : new Date());
  const yearListRef = React.useRef<HTMLDivElement>(null);
  
  // State for expanded years in the selector
  const [expandedYear, setExpandedYear] = useState<number | null>(currentViewDate.getFullYear());

  const selectedDate = value ? new Date(value) : null;

  // Auto-scroll to selected year when popover opens
  React.useEffect(() => {
    if (open && expandedYear && yearListRef.current) {
      setTimeout(() => {
        const yearElement = document.getElementById(`year-${expandedYear}`);
        if (yearElement) {
          yearElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 100);
    }
  }, [open, expandedYear]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentViewDate));
    const end = endOfWeek(endOfMonth(currentViewDate));
    return eachDayOfInterval({ start, end });
  }, [currentViewDate]);

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const range = [];
    for (let i = currentYear - 100; i <= currentYear + 10; i++) {
      range.push(i);
    }
    return range.reverse(); // Show recent years first
  }, []);

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const toggleYear = (year: number) => {
    if (expandedYear === year) {
      setExpandedYear(null);
    } else {
      setExpandedYear(year);
      setCurrentViewDate(setYear(currentViewDate, year));
    }
  };

  const selectMonthYear = (monthIdx: number, year: number) => {
    const newDate = setYear(setMonth(currentViewDate, monthIdx), year);
    setCurrentViewDate(newDate);
  };

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary), 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary), 0.3);
        }
      `}</style>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-medium h-11 bg-background/50 border-muted-foreground/30 px-3 hover:border-primary/50 transition-all shadow-sm",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
            {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden bg-background/95 backdrop-blur-xl" align="start">
          <div className="flex flex-col sm:flex-row h-[420px] max-w-[95vw]">
            {/* Year/Month Selector Side Bar */}
            <div 
              ref={yearListRef}
              className="w-full sm:w-56 border-r border-primary/5 bg-muted/40 overflow-y-auto border-b sm:border-b-0 custom-scrollbar"
            >
              <div className="p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80 mb-4 px-2">Select Year</p>
                {years.map((year) => (
                  <div key={year} id={`year-${year}`} className="space-y-1">
                    <button
                      onClick={() => toggleYear(year)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all",
                        expandedYear === year 
                          ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" 
                          : "hover:bg-primary/10 text-foreground/80 hover:text-primary"
                      )}
                    >
                      {year}
                      {expandedYear === year ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    
                    <AnimatePresence>
                      {expandedYear === year && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="grid grid-cols-3 gap-1 p-1.5 bg-background/60 rounded-xl mt-1 border border-primary/10 shadow-inner"
                        >
                          {months.map((month, idx) => (
                            <button
                              key={month}
                              onClick={() => selectMonthYear(idx, year)}
                              className={cn(
                                "py-1.5 text-[10px] rounded-lg transition-all",
                                currentViewDate.getFullYear() === year && currentViewDate.getMonth() === idx 
                                  ? "bg-primary/20 text-primary font-bold border border-primary/20 shadow-sm" 
                                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                              )}
                            >
                              {month}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Day Grid Main Area */}
            <div className="p-5 w-[320px] flex flex-col bg-background/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Pick a day</span>
                  <h4 className="text-lg font-bold tracking-tight text-foreground">
                    {format(currentViewDate, 'MMMM yyyy')}
                  </h4>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    aria-label="Previous month"
                    className="h-8 w-8 rounded-lg border-primary/10 bg-background/50 hover:bg-primary/5" 
                    onClick={() => setCurrentViewDate(subMonths(currentViewDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    aria-label="Next month"
                    className="h-8 w-8 rounded-lg border-primary/10 bg-background/50 hover:bg-primary/5" 
                    onClick={() => setCurrentViewDate(addMonths(currentViewDate, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-[11px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 flex-1">
                {days.map((day, idx) => {
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentViewDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        "h-10 w-full flex items-center justify-center rounded-xl text-sm transition-all relative",
                        !isCurrentMonth && "text-muted-foreground/20",
                        isCurrentMonth && !isSelected && "hover:bg-primary/10 text-foreground/90",
                        isSelected && "bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/30 ring-2 ring-primary/20 scale-110 z-10",
                        isToday && !isSelected && "text-primary font-bold after:content-[''] after:absolute after:bottom-1.5 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 pt-4 border-t border-primary/10 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[11px] uppercase tracking-widest font-bold hover:bg-primary/5"
                  onClick={() => {
                    const today = new Date();
                    setCurrentViewDate(today);
                    handleDateSelect(today);
                  }}
                >
                  Today
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[11px] uppercase tracking-widest font-bold text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
