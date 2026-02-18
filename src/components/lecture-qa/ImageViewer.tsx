import { X } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  onClose: () => void;
}

const ImageViewer = ({ src, onClose }: ImageViewerProps) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
    onClick={onClose}
  >
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
    >
      <X size={20} />
    </button>
    <img
      src={src}
      alt="Full view"
      className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

export default ImageViewer;
