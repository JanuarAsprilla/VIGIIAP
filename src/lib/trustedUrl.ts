const ALLOWED_ORIGINS = [
  window.location.origin,
  import.meta.env.VITE_R2_PUBLIC_URL || '',
  import.meta.env.VITE_API_URL        || '',
].filter(Boolean)

export function isTrustedUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    return ALLOWED_ORIGINS.some((o) => {
      try { return parsed.origin === new URL(o).origin } catch { return false }
    })
  } catch { return false }
}
