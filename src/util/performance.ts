/**
 * it's better to test time at first
 * @param f function need to measure
 * @param label time log label
 * @returns function wrapped with time measure  
 */
export const measureTimeWrapper = <T extends unknown[]>(
  f: (...args: T) => Promise<unknown> | unknown,
  label: string = 'test',
) => {
  return async function (...args: T) {
    console.time(label);
    await f(...args);
    console.timeEnd(label);
  }
}


/**
 * it's better to test memory at last
 * @param f function need to measure
 * @returns function wrapped with memory measure
 */
export const measureMemoryWrapper = <T extends unknown[]>(
  f: (...args: T) => Promise<unknown>,
) => {
  return async function (...args: T) {
    const mem = process.memoryUsage();
    const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + 'MB';
    await f(...args);
    console.log('Process: heapTotal ' + formatBytes(mem.heapTotal) + ' heapUsed ' + formatBytes(mem.heapUsed) + ' rss ' + formatBytes(mem.rss));
  }
}

export const measurePerformanceWrapper = <T extends unknown[]>(
  f: (...args: T) => Promise<unknown> | unknown,
  label: string = 'test',
) => measureMemoryWrapper(measureTimeWrapper(f, label));
