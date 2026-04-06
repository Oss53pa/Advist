/**
 * ImageUploader - Composant d'upload d'images avec drag & drop
 */
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Link, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string, file?: File) => void;
  onFileSelect?: (file: File) => void;
  placeholder?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'banner';
}

export default function ImageUploader({
  value,
  onChange,
  onFileSelect,
  placeholder = 'Glissez une image ou cliquez pour sélectionner',
  className = '',
  aspectRatio = 'video',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
  }[aspectRatio];

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez JPG, PNG, GIF ou WebP.');
      return false;
    }

    if (file.size > maxSize) {
      setError('Image trop volumineuse. Maximum 5 Mo.');
      return false;
    }

    setError('');
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    try {
      // Créer une preview locale
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl, file);
        if (onFileSelect) {
          onFileSelect(file);
        }
      };
      reader.readAsDataURL(file);
    } catch (_err) {
      setError("Erreur lors du chargement de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {value ? (
        <div
          className={`relative ${aspectRatioClass} bg-primary-100 rounded-lg overflow-hidden group`}
        >
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white rounded-full hover:bg-primary-100 transition-colors"
              title="Changer l'image"
            >
              <Upload className="h-5 w-5 text-primary-700" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Supprimer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !showUrlInput && fileInputRef.current?.click()}
          className={`
            ${aspectRatioClass} border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center cursor-pointer
            transition-colors
            ${
              isDragging
                ? 'border-accent-500 bg-accent-50'
                : 'border-primary-300 hover:border-primary-400 bg-primary-50'
            }
          `}
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-primary-400 animate-spin" />
          ) : showUrlInput ? (
            <div className="p-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-3 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="px-3 py-2 bg-primary-200 text-primary-700 rounded-lg hover:bg-primary-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-primary-400 mb-3" />
              <p className="text-sm text-primary-600 text-center px-4">{placeholder}</p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 bg-accent-600 text-white rounded-lg text-sm hover:bg-accent-700"
                >
                  <Upload className="h-4 w-4" />
                  Parcourir
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUrlInput(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-200 text-primary-700 rounded-lg text-sm hover:bg-primary-300"
                >
                  <Link className="h-4 w-4" />
                  URL
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
