'use client';

/**
 * Contact form.
 *
 * [CORRECTNESS] `onSubmit` previously ignored its form data, awaited an 800ms
 * `setTimeout`, and rendered "Message sent! We'll get back to you within 24
 * hours." Nothing was ever sent anywhere, so every enquiry — including
 * complaints and pre-purchase questions — was discarded while the sender
 * believed it had been received.
 *
 * It now posts to `/api/contact`, which validates, throttles per IP, screens a
 * honeypot field, and forwards to the backend support service.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';

/**
 * Mirrors the server contract in `app/api/contact/route.ts`. Kept in sync
 * deliberately: client-side validation exists for immediate feedback, and the
 * server revalidates because a client check is never a control.
 */
const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  subject: z.string().trim().min(3, 'Please enter a subject.').max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Please describe your enquiry in at least 10 characters.')
    .max(5000, 'Please keep your message under 5,000 characters.'),
  /** Honeypot — hidden from humans, filled by naive bots. See the API route. */
  website: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'support@eshop.com' },
  { icon: Phone, label: 'Phone', value: '+91 1800-123-4567' },
  { icon: MapPin, label: 'Address', value: '123 Commerce St, Mumbai, Maharashtra 400001' },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message ?? "We couldn't send your message just now. Please try again."
        );
      }

      reset();
      setSubmitted(true);
    } catch (error) {
      // Surfaced inline rather than as a toast: the sender has just typed a
      // message they do not want to lose, and needs the failure to persist on
      // screen alongside their still-intact draft.
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't send your message just now. Please try again."
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground mx-auto max-w-lg">
          We&apos;re here to help! Reach out and our team will get back to you within 24 hours.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-4">
          {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Icon className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {label}
                  </p>
                  <p className="font-medium">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-20 text-center">
                <CheckCircle2 className="text-success mx-auto mb-4 h-14 w-14" aria-hidden="true" />
                <h2 className="text-xl font-bold" role="status">
                  Message sent
                </h2>
                <p className="text-muted-foreground mt-2">
                  We&apos;ll get back to you within 24 hours.
                </p>
                <Button className="mt-6" onClick={() => setSubmitted(false)} variant="outline">
                  Send another message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name*</Label>
                      <Input
                        id="name"
                        autoComplete="name"
                        {...register('name')}
                        placeholder="John Doe"
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                      />
                      {errors.name && (
                        <p id="name-error" role="alert" className="text-destructive text-sm">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email*</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                        placeholder="you@example.com"
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && (
                        <p id="email-error" role="alert" className="text-destructive text-sm">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject*</Label>
                    <Input
                      id="subject"
                      {...register('subject')}
                      placeholder="How can we help?"
                      aria-invalid={errors.subject ? true : undefined}
                      aria-describedby={errors.subject ? 'subject-error' : undefined}
                    />
                    {errors.subject && (
                      <p id="subject-error" role="alert" className="text-destructive text-sm">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message*</Label>
                    <Textarea
                      id="message"
                      {...register('message')}
                      rows={6}
                      placeholder="Tell us more…"
                      aria-invalid={errors.message ? true : undefined}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                    />
                    {errors.message && (
                      <p id="message-error" role="alert" className="text-destructive text-sm">
                        {errors.message.message}
                      </p>
                    )}
                  </div>
                  {/*
                    Honeypot. Hidden from sighted users with an off-screen
                    position rather than `display:none` (which some bots
                    detect), and from assistive technology with aria-hidden and
                    tabIndex={-1} so a screen-reader user never encounters it.
                  */}
                  <div className="absolute left-[-9999px]" aria-hidden="true">
                    <label htmlFor="website">Leave this field empty</label>
                    <input
                      id="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      {...register('website')}
                    />
                  </div>

                  {submitError && (
                    <p
                      role="alert"
                      className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-3 text-sm"
                    >
                      {submitError}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    {isSubmitting ? 'Sending…' : 'Send message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
