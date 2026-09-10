import { siteConfig } from '@/core/config/site';

export function NoScriptFallback() {
  return (
    <noscript>
      <div
        role="alert"
        aria-live="assertive"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-white p-4 font-sans dark:bg-zinc-950"
      >
        <div className="border-border bg-card max-w-md rounded-lg border p-6 text-center shadow-lg">
          <h1 className="text-foreground text-xl font-bold">JavaScript Required</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {siteConfig.name} requires JavaScript to function. Please enable JavaScript in your
            browser settings and reload the page.
          </p>
          <a
            href="/no-js"
            className="text-primary hover:text-primary/80 mt-4 inline-block text-sm font-medium underline"
          >
            Continue with limited functionality →
          </a>
        </div>
      </div>
    </noscript>
  );
}
