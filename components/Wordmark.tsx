/* eslint-disable @next/next/no-img-element */
export function Wordmark({ className }: { className?: string }) {
  return (
    <img
      src="/dynrinth-wordmark.svg"
      alt="Dynrinth"
      className={`h-6 w-auto block${className ? ` ${className}` : ''}`}
    />
  );
}
