import { useEffect, useRef } from 'react';
import { renderMarkdown } from './markdown';

/** The rendered page: nodes built by the shared renderer, mounted as they are. */
export function Preview({ source }: { source: string }) {
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    box.current?.replaceChildren(...renderMarkdown(source));
  }, [source]);
  return <article ref={box} className="preview" aria-label="Preview" />;
}
