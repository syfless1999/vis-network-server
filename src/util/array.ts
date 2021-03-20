export const uniqueArray = <T>(
  arr: T[],
  index: (item: T) => unknown,
): T[] => {
  const map = new Map();
  return arr.filter((a) => !map.has(index(a)) && map.set(index(a), 1));
};

export const chunk = <T>(
  arr: T[],
  size: number,
): (T[])[] => {
  var rsArr = [];
  for (var i = 0; i < arr.length; i += size) {
    var tempArr = [];
    for (var j = 0; j < size && i + j < arr.length; j++) {
      tempArr.push(arr[i + j]);
    }
    rsArr.push(tempArr);
  }
  return rsArr;
}

export const array2Map = <T, U>(
  arr: U[],
  keyFunc: (v: U, i: number) => T,
  map?: Map<T, U>,
): Map<T, U> => {
  const newMap = map || new Map<T, U>();
  arr.forEach((v, i) => {
    const key = keyFunc(v, i);
    newMap.set(key, v);
  });
  return newMap;
};
