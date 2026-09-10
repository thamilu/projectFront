import Image from 'next/image';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Star, Quote } from 'lucide-react';
import { TESTIMONIALS_PLACEHOLDERS as demoTestimonials } from '@/features/home/constants/placeholders';

// ============================================================================
// Constants & Configuration
// ============================================================================

const TESTIMONIALS_CONFIG = {
  heading: 'Trusted by Excellence',
  subheading:
    'Join 50,000+ industry leaders who rely on our enterprise solutions every single day.',
};

// ============================================================================
// Component
// ============================================================================

export function TestimonialsSection() {
  const { heading, subheading } = TESTIMONIALS_CONFIG;
  // Robustness: Always show something high-quality
  const testimonials = demoTestimonials;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden bg-slate-50 py-24 dark:bg-slate-950"
    >
      {/* Decorative background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 container mx-auto">
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <h2
            id="testimonials-heading"
            className="mb-6 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white"
          >
            {heading}
          </h2>
          <p className="text-lg text-slate-600 md:text-xl dark:text-slate-400">{subheading}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="group relative border-none bg-white shadow-xl shadow-slate-200/50 transition-all duration-500 hover:-translate-y-3 dark:bg-slate-900 dark:shadow-none"
            >
              <CardContent className="flex h-full flex-col p-8 md:p-10">
                {/* Floating Quote Icon */}
                <div className="absolute top-6 right-8 text-slate-100 transition-colors group-hover:text-blue-500/10 dark:text-slate-800">
                  <Quote className="h-12 w-12" />
                </div>

                <div className="mb-6 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <blockquote className="relative z-10 mb-8 text-lg leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                  "{testimonial.quote}"
                </blockquote>

                <div className="mt-auto flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full border-2 border-white shadow-md grayscale transition-all duration-500 group-hover:grayscale-0 dark:border-slate-800"
                    />
                    <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 dark:border-slate-900">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                      {testimonial.role}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
