export const uniqueArray = <T>(
  arr: T[],
  index: (item: T) => unknown,
): T[] => {
  const map = new Map();
  return arr.filter((a) => !map.has(index(a)) && map.set(index(a), 1));
};
