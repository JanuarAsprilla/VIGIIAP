import * as Sentry from '@sentry/react'
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

function handleVital({ name, value, rating, delta, id }: Metric): void {
  Sentry.addBreadcrumb({
    type: 'performance',
    category: 'web-vitals',
    message: name,
    level: rating === 'good' ? 'info' : rating === 'needs-improvement' ? 'warning' : 'error',
    data: {
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      rating,
      delta,
      id,
    },
  })

  if (rating === 'poor') {
    Sentry.captureMessage(`Poor Web Vital: ${name}`, {
      level: 'warning',
      tags: { web_vital: name, rating },
      extra: { value, delta, id },
    })
  }
}

export function reportWebVitals(): void {
  onCLS(handleVital)
  onINP(handleVital)
  onLCP(handleVital)
  onFCP(handleVital)
  onTTFB(handleVital)
}
