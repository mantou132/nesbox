import QOI from 'qoijs';

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

export function encodeQoiFrame(
  prevFrame: Uint8ClampedArray,
  currentFrame: Uint8ClampedArray,
  width: number,
  qoiWholeFrame: boolean,
) {
  const lineBytes = width * 4;

  let start = 0;
  let end = 0;

  if (qoiWholeFrame) {
    end = currentFrame.length;
  } else if (prevFrame.length > 0) {
    const endIndex = findDiffIndex(prevFrame, currentFrame, true);

    const endLine = Math.trunc(endIndex / lineBytes);

    if (endIndex >= 0) {
      const startIndex = findDiffIndex(prevFrame, currentFrame, false);

      start = Math.trunc(startIndex / lineBytes) * lineBytes;
      end = (endLine + 1) * lineBytes;
    }
  }

  if (end - start === 0) {
    return [new Uint8ClampedArray(), new Uint8ClampedArray(4)];
  } else {
    const h = (end - start) / lineBytes;

    return [
      new Uint8ClampedArray(
        QOI.encode(new Uint8ClampedArray(currentFrame.buffer, currentFrame.byteOffset + start, end - start), {
          width: width,
          height: h,
          channels: 4,
          colorspace: 0,
        }),
      ),
      // x, y, w, h
      new Uint8ClampedArray([0, start / lineBytes, width === 256 ? 0 : width, h]),
    ];
  }
}
