export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, wait = 200) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}

export default debounce
