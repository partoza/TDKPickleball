import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({
  showSpinner: false,
  minimum: 0.12,
  speed: 220,
  trickleSpeed: 240,
});

let activeRequests = 0;
let startTimer: number | undefined;

export function beginRequestProgress() {
  activeRequests += 1;
  if (activeRequests !== 1 || typeof window === 'undefined') return;
  startTimer = window.setTimeout(() => NProgress.start(), 120);
}

export function endRequestProgress() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests !== 0 || typeof window === 'undefined') return;
  if (startTimer !== undefined) window.clearTimeout(startTimer);
  startTimer = undefined;
  NProgress.done();
}
