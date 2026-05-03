'use client';

import { memo } from 'react';
import { Sun, Moon, Monitor, Volume2, VolumeX, Type, MousePointer, Palette } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/store/settings-store';
import { accentColors } from '@/constants';

const themes = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
] as const;

export const AppearanceTab = memo(function AppearanceTab() {
  const { theme, accentColor, fontSize, sound, autoplay, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Palette className="h-5 w-5" />
        Appearance
      </h3>

      {/* Theme Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Theme</Label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => updateSetting('theme', value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className={`h-6 w-6 ${theme === value ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${theme === value ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Accent Color */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Accent Color</Label>
        <div className="flex flex-wrap gap-3">
          {accentColors.map((color) => (
            <button
              key={color.name}
              onClick={() => updateSetting('accentColor', color.name)}
              className={`w-10 h-10 rounded-full ${color.class} transition-all hover:scale-110 ${
                accentColor === color.name ? 'ring-4 ring-offset-2 ring-gray-400' : ''
              }`}
              aria-label={`Select ${color.name} color`}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Font Size */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4" />
            Font Size
          </Label>
          <span className="text-sm text-muted-foreground">{fontSize}px</span>
        </div>
        <Slider
          value={fontSize}
          onValueChange={(value: number) => updateSetting('fontSize', value)}
          min={12}
          max={24}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      <Separator />

      {/* Sound Effects */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          <div>
            <Label className="text-sm font-medium">Sound Effects</Label>
            <p className="text-xs text-muted-foreground">Play sounds for interactions</p>
          </div>
        </div>
        <Switch
          checked={sound}
          onChange={e => updateSetting('sound', e.target.checked)}
        />
      </div>

      {/* Autoplay */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MousePointer className="h-5 w-5" />
          <div>
            <Label className="text-sm font-medium">Autoplay Videos</Label>
            <p className="text-xs text-muted-foreground">Auto-play product videos</p>
          </div>
        </div>
        <Switch
          checked={autoplay}
          onChange={e => updateSetting('autoplay', e.target.checked)}
        />
      </div>
    </div>
  );
});
