function prettySize(bytes, separator = '', postFix = '') {
  if (bytes) {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.min(parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10), sizes.length - 1);
      return `${(bytes / (1024 ** i)).toFixed(i ? 1 : 0)}${separator}${sizes[i]}${postFix}`;
  }
  return 'n/a';
}

function roundToTwoDecimals(num) {
  // Number.EPSILON to ensure things like 1.005 round correctly
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

module.exports = {
  prettySize,
  roundToTwoDecimals,
}
