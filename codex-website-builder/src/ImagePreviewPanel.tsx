import { closePluginModal } from './plugin-modal';

export function ImagePreviewPanel({
  url,
  name,
  onClose
}: {
  url: string;
  name?: string;
  onClose?: () => void;
}) {
  const close = async () => {
    if (onClose) onClose();
    else await closePluginModal();
  };

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
        <button
          type="button"
          className="prompt-lightbox-close"
          aria-label="关闭预览"
          title="关闭"
          onClick={() => void close()}
        >
          ×
        </button>
      </header>
      <div className="image-preview-body">
        <img src={url} alt={name || '图片预览'} />
      </div>
      <footer>
        <button type="button" className="primary" onClick={() => void close()}>
          完成
        </button>
      </footer>
    </section>
  );
}
