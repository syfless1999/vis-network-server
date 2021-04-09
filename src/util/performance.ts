/**
 * it's better to test time at first
 * @param f function need to measure
 * @param label time log label
 * @returns function wrapped with time measure  
 */
export const measureTimeWrapper = <T extends unknown[], U>(
  f: (...args: T) => Promise<U> | U,
  label: string = 'test',
) => {
  return async function (...args: T) {
    console.time(label);
    const res = await f(...args);
    console.timeEnd(label);
    return res;
  }
}

/**
 * it's better to test memory at last
 * @param f function need to measure
 * @returns function wrapped with memory measure
 */
export const measureMemoryWrapper = <T extends unknown[], U>(
  f: (...args: T) => Promise<U> | U,
) => {
  return async function (...args: T) {
    const m1 = process.memoryUsage();
    const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + 'MB';
    const res = await f(...args);
    const m2 = process.memoryUsage();
    console.log('Process: heapTotal ' + formatBytes(m2.heapTotal - m1.heapTotal) + ' heapUsed ' + formatBytes(m2.heapUsed - m1.heapUsed) + ' rss ' + formatBytes(m2.rss - m1.rss));
    return res;
  }
}

export const measurePerformanceWrapper = <T extends unknown[], U>(
  f: (...args: T) => Promise<U> | U,
  label: string = 'test',
) => measureMemoryWrapper(measureTimeWrapper(f, label));
