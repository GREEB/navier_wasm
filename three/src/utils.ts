export const getDisplayDimensions = (
    width: number,
    height: number
  ): number[] => {
    let count = 280;
    if (Math.max(width, height) / Math.min(width, height) <= 1.5) {
      count = 280;
    }
    if (width > height) {
      return [count, count / (width / height)];
    } else if (height > width) {
      return [count / (height / width), count];
    } else {
      return [width, height];
    }
  };
  