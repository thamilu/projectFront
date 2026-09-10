import { AVATAR_SIZE } from './profileHeader.constants';

/**
 * ProfileHeaderSkeleton
 *
 * Companion skeleton component for ProfileHeader. Mirrors ProfileHeader's
 * real DOM structure and responsive breakpoints exactly (outer header,
 * left avatar+details column stacking at `sm:`, right account-metadata
 * column stacking at `md:`) — a skeleton that stacks or sizes differently
 * than the real content it's masking causes the exact layout shift (CLS)
 * it exists to prevent, once the real header mounts in its place.
 */
export function ProfileHeaderSkeleton() {
  return (
    <div
      className="w-full border-t-[5px] border-t-primary rounded-2xl border border-slate-800 bg-slate-900/20 p-6 md:p-8 shadow-xl backdrop-blur-md"
      aria-busy="true"
      aria-label="Loading profile header"
    >
      <div className="flex flex-col items-start justify-between gap-8 md:flex-row w-full">
        {/* Left Side: Avatar + Details — mirrors ProfileHeader's flex-col sm:flex-row split */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
          {/* Avatar Skeleton — sized from AVATAR_SIZE, the same token ProfileHeader's
              avatar frame uses, so the two can't silently drift apart again. */}
          <div
            className={`bg-muted-foreground/10 shrink-0 rounded-full animate-pulse motion-reduce:animate-none ${AVATAR_SIZE}`}
          />

          {/* Text Skeletons */}
          <div className="flex-1 flex flex-col items-center sm:items-start gap-2 w-full max-w-xs">
            {/* Heading — h-8, growing to h-9 at sm: to match HEADING_SIZE's text-2xl -> sm:text-3xl line-height increase */}
            <div className="bg-muted-foreground/10 h-8 sm:h-9 w-48 animate-pulse motion-reduce:animate-none rounded" />
            <div className="flex items-center gap-2">
              <div className="bg-muted-foreground/10 h-5 w-16 animate-pulse motion-reduce:animate-none rounded" />
              <div className="bg-muted-foreground/10 h-5 w-20 animate-pulse motion-reduce:animate-none rounded" />
              <div className="bg-muted-foreground/10 h-4 w-36 animate-pulse motion-reduce:animate-none rounded" />
            </div>
          </div>
        </div>

        {/* Right Side: Account Metadata Panel — previously absent from this
            skeleton entirely, which meant a ~320px desktop column appeared
            out of nowhere the instant real data loaded, the single largest
            source of layout shift here. */}
        <div className="w-full md:w-80 border-t border-slate-800/80 md:border-t-0 md:border-l md:border-slate-800/80 pt-6 md:pt-0 md:pl-8 flex flex-col gap-4">
          <div className="bg-muted-foreground/10 h-4 w-28 animate-pulse motion-reduce:animate-none rounded" />

          <div className="space-y-3">
            {['Status', 'Verification', 'KYC Status', 'Member Since'].map((label, index) => (
              <div
                key={label}
                className={
                  index < 3
                    ? 'flex items-center justify-between border-b border-slate-800/40 pb-2.5'
                    : 'flex items-center justify-between'
                }
              >
                <div className="bg-muted-foreground/10 h-3 w-20 animate-pulse motion-reduce:animate-none rounded" />
                <div className="bg-muted-foreground/10 h-4 w-16 animate-pulse motion-reduce:animate-none rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
