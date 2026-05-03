import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AppleIcon } from '@/components/icons/AppleIcon';
import { GooglePlayIcon } from '@/components/icons/GooglePlayIcon';

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
      className="py-16 bg-gradient-to-br from-primary to-secondary text-white"
      aria-labelledby="app-download-heading"
    >
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="md:w-1/2 md:max-w-xl">
          <h2 id="app-download-heading" className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Get the EcomApp Mobile App
          </h2>
          <p className="text-lg mb-6">
            Shop on the go with our easy-to-use mobile app. Download now for exclusive deals and a
            seamless shopping experience!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <Button
              asChild
              size="lg"
              className="bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white transition-colors min-h-[44px]"
            >
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download EcomApp on the App Store"
              >
                <AppleIcon className="w-6 h-6 inline-block mr-2" />
                App Store
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white transition-colors min-h-[44px]"
            >
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get EcomApp on Google Play"
              >
                <GooglePlayIcon className="w-6 h-6 inline-block mr-2" />
                Google Play
              </a>
            </Button>
          </div>
        </div>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={256}
          height={256}
          className="w-48 sm:w-56 md:w-64 h-auto object-contain drop-shadow-2xl"
          priority={false}
          unoptimized
        />
      </div>
    </section>
  );
}
