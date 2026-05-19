'use client';

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

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormValues = z.infer<typeof schema>;

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'support@eshop.com' },
  { icon: Phone, label: 'Phone', value: '+91 1800-123-4567' },
  { icon: MapPin, label: 'Address', value: '123 Commerce St, Mumbai, Maharashtra 400001' },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (_data: FormValues) => {
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          We&apos;re here to help! Reach out and our team will get back to you within 24 hours.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-4">
          {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
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
                <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
                <h2 className="text-xl font-bold">Message sent!</h2>
                <p className="mt-2 text-muted-foreground">We&apos;ll get back to you within 24 hours.</p>
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name*</Label>
                      <Input id="name" {...register('name')} placeholder="John Doe" />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email*</Label>
                      <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject*</Label>
                    <Input id="subject" {...register('subject')} placeholder="How can we help?" />
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message*</Label>
                    <Textarea id="message" {...register('message')} rows={6} placeholder="Tell us more…" />
                    {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Message
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
