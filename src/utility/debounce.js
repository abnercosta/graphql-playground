export default function debounce(duration, fn) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn.apply(this, arguments);
    }, duration);
  };
}
