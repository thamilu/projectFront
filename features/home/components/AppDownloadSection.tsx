import Image from 'next/image';
import { Button } from '@/shared/ui/atoms/button';
import { AppleIcon } from '@/shared/ui/atoms/icons/AppleIcon';
import { GooglePlayIcon } from '@/shared/ui/atoms/icons/GooglePlayIcon';
import { Star, Download } from 'lucide-react';

interface AppDownloadSectionProps {
  appStoreUrl?: string;
  playStoreUrl?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export function AppDownloadSection({
  appStoreUrl = 'https://apps.apple.com/app/ecomapp',
  playStoreUrl = 'https://play.google.com/store/apps/details?id=com.ecomapp',
  imageSrc = '/app-download.png',
  imageAlt = 'EcomApp mobile application preview showing product browsing interface',
}: AppDownloadSectionProps) {
  return (
    <section className="py-20 md:py-24" aria-labelledby="app-download-heading">
      {/*
        The gradient is a PANEL inside the container, not a full-bleed band.

        It previously sat on the <section> and ran edge to edge, while every
        neighbouring section stopped at the container's max-width — so this and
        the flash-deals band were the only two things on the page reaching the
        viewport edge, and the layout appeared to change width around them.
        `rounded-3xl` plus `overflow-hidden` keeps the decorative blurred
        circles clipped to the panel.
      */}
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 py-16 text-white sm:px-10 md:py-20">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/5 blur-3xl" />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between gap-12 md:flex-row">
        <div className="space-y-6 md:w-1/2 md:max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase backdrop-blur-sm">
            <Download className="h-3.5 w-3.5" />
            Available Now
          </div>

          <h2
            id="app-download-heading"
            className="text-3xl leading-[1.1] font-black tracking-tight text-balance sm:text-4xl md:text-5xl"
          >
            Get the EcomApp <br />
            <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Mobile App
            </span>
          </h2>
          <p className="max-w-md text-lg leading-relaxed text-white/80">
            Shop on the go with our easy-to-use mobile app. Download now for exclusive deals and a
            seamless shopping experience!
          </p>

          {/* Social proof */}
          <div className="flex items-center gap-3 text-sm text-white/70">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-semibold text-white">4.9</span>
            <span>• 50K+ downloads</span>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="min-h-[52px] rounded-xl border border-white/10 bg-black/80 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-black hover:shadow-xl active:bg-neutral-900"
            >
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download EcomApp on the App Store"
              >
                <AppleIcon className="mr-2 inline-block h-6 w-6" />
                <div className="text-left">
                  <div className="text-[10px] font-normal opacity-70">Download on the</div>
                  <div className="-mt-0.5 text-sm font-bold">App Store</div>
                </div>
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="min-h-[52px] rounded-xl border border-white/10 bg-black/80 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-black hover:shadow-xl active:bg-neutral-900"
            >
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get EcomApp on Google Play"
              >
                <GooglePlayIcon className="mr-2 inline-block h-6 w-6" />
                <div className="text-left">
                  <div className="text-[10px] font-normal opacity-70">Get it on</div>
                  <div className="-mt-0.5 text-sm font-bold">Google Play</div>
                </div>
              </a>
            </Button>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative flex items-center justify-center md:w-1/2">
          {/* Glow ring behind phone */}
          <div className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-2xl" />
          <div
            className="absolute h-56 w-56 animate-pulse rounded-full border border-white/10"
            style={{ animationDuration: '4s' }}
          />

          <Image
            src={imageSrc}
            alt={imageAlt}
            width={320}
            height={320}
            className="relative z-10 h-auto w-56 object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-transform duration-700 hover:scale-105 sm:w-64 md:w-72"
            priority={false}
          />
        </div>
      </div>
        </div>
      </div>
    </section>
  );
}
