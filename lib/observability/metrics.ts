import { logger } from '@/lib/observability/logger';

export function recordMetric(name: string, value: number, tags?: Record<string, unknown>) {
  logger.info('metric', { name, value, tags });
}
