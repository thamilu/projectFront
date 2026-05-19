import Image from 'next/image';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Star, Quote } from 'lucide-react';
import { testimonials as demoTestimonials } from '@/shared/constants/demoData';

// ============================================================================
// Constants & Configuration
// ============================================================================

const TESTIMONIALS_CONFIG = {
  heading: 'Trusted by Excellence',
  subheading: 'Join 50,000+ industry leaders who rely on our enterprise solutions every single day.',
};

// ============================================================================
// Component
// ============================================================================

export function TestimonialsSection() {
  const { heading, subheading } = TESTIMONIALS_CONFIG;
  // Robustness: Always show something high-quality
  const testimonials = demoTestimonials;

  return (
    <section aria-labelledby="testimonials-heading" className="py-24 relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 id="testimonials-heading" className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">
            {heading}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
            {subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="group relative border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:-translate-y-3"
            >
              <CardContent className="p-8 md:p-10 flex flex-col h-full">
                {/* Floating Quote Icon */}
                <div className="absolute top-6 right-8 text-slate-100 dark:text-slate-800 transition-colors group-hover:text-blue-500/10">
                  <Quote className="w-12 h-12" />
                </div>

                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <blockquote className="relative z-10 text-lg text-slate-700 dark:text-slate-300 mb-8 leading-relaxed font-medium">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="mt-auto flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-800 shadow-md grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {testimonial.name}
                    </h4>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
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
