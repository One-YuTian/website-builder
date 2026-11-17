export function ImagePreviewPanel({
  url,
  name
}: {
  url: string;
  name?: string;
  onClose?: () => void;
}) {
  return (
    <section
      className="plugin-modal image-preview-modal prompt-lightbox-box"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
    >
      <header>
        <div>
          <h2 id="image-preview-title">{name || '图片预览'}</h2>
        </div>
      </header>
      <div className="image-preview-body">
        <img
          src={url}
          alt={name || '图片预览'}
          draggable={false}
          onDragStart={e => e.preventDefault()}
        />
      </div>
    </section>
  );
}
