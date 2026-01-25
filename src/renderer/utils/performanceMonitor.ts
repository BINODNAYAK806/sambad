// Performance monitoring utility for debugging startup issues

export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, number> = new Map();

  static mark(label: string) {
    const now = performance.now();
    this.marks.set(label, now);
    console.log(`[Perf] MARK: ${label} at ${now.toFixed(2)}ms`);
  }

  static measure(label: string, startMark: string) {
    const endTime = performance.now();
    const startTime = this.marks.get(startMark);
    
    if (startTime === undefined) {
      console.warn(`[Perf] Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = endTime - startTime;
    this.measures.set(label, duration);
    console.log(`[Perf] MEASURE: ${label} = ${duration.toFixed(2)}ms`);
    return duration;
  }

  static getMetrics() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
    };
  }

  static logSummary() {
    console.log('[Perf] ===== PERFORMANCE SUMMARY =====');
    console.log('[Perf] Marks:', Object.fromEntries(this.marks));
    console.log('[Perf] Measures:', Object.fromEntries(this.measures));
    console.log('[Perf] ===== END SUMMARY =====');
  }
}

// Auto-mark key startup points
if (typeof window !== 'undefined') {
  // Mark app render start
  const appStart = performance.now();
  window.addEventListener('load', () => {
    const loadDuration = performance.now() - appStart;
    console.log(`[Perf] Total page load time: ${loadDuration.toFixed(2)}ms`);
  });
}
