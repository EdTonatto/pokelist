import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, X } from "lucide-react";

export function ImagePreview({
  src,
  name,
  onClose,
}: {
  src: string;
  name: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return createPortal(
    <div
      className="image-preview-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="image-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Imagem ampliada: ${name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="image-preview-close"
          onClick={onClose}
          aria-label="Fechar imagem"
        >
          <X size={18} />
        </button>
        <img src={src} alt={name} />
        <span>{name}</span>
      </div>
    </div>,
    document.body,
  );
}
export function ImageExpand({ src, name }: { src: string; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="image-expand-button"
        title="Ampliar imagem"
        aria-label={`Ampliar carta ${name}`}
        onClick={() => setOpen(true)}
      >
        <Expand size={15} />
      </button>
      {open && (
        <ImagePreview src={src} name={name} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
