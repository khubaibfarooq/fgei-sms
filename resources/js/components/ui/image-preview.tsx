import React from 'react';
import { cn } from '@/lib/utils';

 export function ImagePreview({
  dataImg,
  size,       // optional size class like "h-48" or "h-64"
  className,  // optional extra classes
 }: {
  dataImg: string | File | null;
  size?: string;
  className?: string;
 }) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(() => {
    if (!dataImg) return null;
    return typeof dataImg === 'string' ? `/assets/${dataImg}` : null;
  });
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (dataImg instanceof File) {
      const url = URL.createObjectURL(dataImg);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof dataImg === 'string' && dataImg) {
      setPreviewUrl(`/assets/${dataImg}`);
    } else {
      setPreviewUrl(null);
    }
  }, [dataImg]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (!previewUrl) {
    return <p className="text-sm text-muted-foreground"></p>;
  }

  // default height if not provided
  const heightClass = size ?? 'h-48';

  return (
    <>
      <img
        src={previewUrl!}
        alt="Preview"
        className={cn('cursor-pointer object-cover rounded', heightClass, className)}
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsOpen(false)}
        >
          <button
            aria-label="Close image"
            className="absolute right-4 top-4 z-60 rounded bg-black/50 text-white p-2 hover:bg-black/60"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          >
            ✕
          </button>

          <div className="max-w-[95%] max-h-[95%]" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewUrl}
              alt="Full"
              className="w-full h-auto max-h-[95vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </>
  );
}