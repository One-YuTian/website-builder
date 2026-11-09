export function Icon({ name }: { name: 'select'|'hand'|'fit'|'width'|'pages'|'refresh'|'zoom'|'reset' }) {
  const paths = {
    select: <><path d="M5 3l14 10-7 1-3 7z"/><path d="m12 14 4 7"/></>,
    hand: <><path d="M8 12V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v8c0 5-3 8-7 8-3 0-5-2-7-5l-3-5a2 2 0 0 1 3-2l2 3"/><path d="M16 10V7"/></>,
    fit: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" strokeDasharray="3 2"/><path d="M8 8h8v8H8z"/></>,
    width: <><rect x="5" y="5" width="14" height="14" rx="1"/><path d="M1 12h7m-4-3-3 3 3 3m19-3h-7m4-3 3 3-3 3"/></>,
    pages: <><rect x="7" y="3" width="14" height="17" rx="1"/><path d="M3 7v15h14M10 7h8m-8 4h8m-8 4h5"/></>,
    refresh: <><path d="M20 10a8 8 0 1 0-2 8M20 4v6h-6"/></>,
    zoom: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M8 10.5h5m-2.5-2.5v5"/></>,
    reset: <><path d="m3 11 9-8 9 8M6 9v12h12V9m-8 12v-7h4v7"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
