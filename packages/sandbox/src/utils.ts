export function utf8ToBase64(str: string) {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(Number(`0x${p1}`))),
  );
}

export function findDiffIndex(old: Uint8ClampedArray, arr: Uint8ClampedArray, reverse: boolean) {
  const len = arr.length;
  let index = reverse ? len - 4 : 0;

  if (old.length === len) {
    while (true) {
      if (index < 0 || index >= len) {
        break;
      }
      const i = index;
      if (old[i] != arr[i] || old[i + 1] != arr[i + 1] || old[i + 2] != arr[i + 2]) {
        break;
      }
      if (reverse) {
        index -= 4;
      } else {
        index += 4;
      }
    }
  }
  return index;
}
