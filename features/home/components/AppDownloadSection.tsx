import Image from 'next/image';
import { Button } from '@/shared/ui/atoms/button';
import { AppleIcon } from '@/shared/ui/atoms/icons/AppleIcon';
import { GooglePlayIcon } from '@/shared/ui/atoms/icons/GooglePlayIcon';
import { Smartphone, Star, Download } from 'lucide-react';

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
    <section
      className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white"
      aria-labelledby="app-download-heading"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="md:w-1/2 md:max-w-xl space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold uppercase tracking-[0.15em]">
            <Download className="w-3.5 h-3.5" />
            Available Now
          </div>

          <h2 id="app-download-heading" className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.1] tracking-tight text-balance">
            Get the EcomApp <br />
            <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Mobile App
            </span>
          </h2>
          <p className="text-lg text-white/80 leading-relaxed max-w-md">
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

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-black/80 hover:bg-black active:bg-neutral-900 text-white transition-all duration-300 min-h-[52px] rounded-xl border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download EcomApp on the App Store"
              >
                <AppleIcon className="w-6 h-6 inline-block mr-2" />
                <div className="text-left">
                  <div className="text-[10px] font-normal opacity-70">Download on the</div>
                  <div className="text-sm font-bold -mt-0.5">App Store</div>
                </div>
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-black/80 hover:bg-black active:bg-neutral-900 text-white transition-all duration-300 min-h-[52px] rounded-xl border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get EcomApp on Google Play"
              >
                <GooglePlayIcon className="w-6 h-6 inline-block mr-2" />
                <div className="text-left">
                  <div className="text-[10px] font-normal opacity-70">Get it on</div>
                  <div className="text-sm font-bold -mt-0.5">Google Play</div>
                </div>
              </a>
            </Button>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative md:w-1/2 flex justify-center items-center">
          {/* Glow ring behind phone */}
          <div className="absolute w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-2xl" />
          <div className="absolute w-56 h-56 border border-white/10 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
          
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={320}
            height={320}
            className="relative z-10 w-56 sm:w-64 md:w-72 h-auto object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-transform duration-700 hover:scale-105"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
