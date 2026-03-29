/**
 * RichTextEditor - Éditeur de contenu avec barre d'outils et insertion d'images
 */
import { useState, useRef, useCallback } from 'react';
import { sanitizeHtml } from '../../utils/sanitize';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Eye,
  Edit3,
  X,
  Upload,
  Loader2,
} from 'lucide-react';
import { blogApi } from '../../services/marketing';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

interface ImageModalState {
  isOpen: boolean;
  url: string;
  alt: string;
  caption: string;
}

const STOCK_IMAGES = [
  {
    category: 'Business',
    images: [
      { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', alt: 'Business analytics dashboard' },
      { url: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=800', alt: 'Team meeting' },
      { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', alt: 'Business presentation' },
      { url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800', alt: 'Modern office' },
    ],
  },
  {
    category: 'Documents',
    images: [
      { url: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800', alt: 'Documents and laptop' },
      { url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800', alt: 'Signing documents' },
      { url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', alt: 'Financial documents' },
      { url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800', alt: 'Contract signing' },
    ],
  },
  {
    category: 'Technologie',
    images: [
      { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', alt: 'Technology circuit' },
      { url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800', alt: 'Cybersecurity' },
      { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', alt: 'Data visualization' },
      { url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800', alt: 'Cloud computing' },
    ],
  },
  {
    category: 'Juridique',
    images: [
      { url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', alt: 'Justice scale' },
      { url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800', alt: 'Law library' },
      { url: 'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?w=800', alt: 'Legal contract' },
      { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', alt: 'Professional lawyer' },
    ],
  },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Rédigez votre contenu...",
  minHeight = "300px",
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [imageModal, setImageModal] = useState<ImageModalState>({
    isOpen: false,
    url: '',
    alt: '',
    caption: '',
  });
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'library'>('library');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const wrapSelection = useCallback((tag: string, attrs: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'texte';

    const openTag = attrs ? `<${tag} ${attrs}>` : `<${tag}>`;
    const closeTag = `</${tag}>`;

    insertAtCursor(openTag, closeTag);
  }, [value, insertAtCursor]);

  const insertHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    const lineContent = value.substring(lineStart, actualLineEnd);

    const newLine = `<h${level}>${lineContent || 'Titre'}</h${level}>`;
    const newText = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);
    onChange(newText);
  };

  const insertList = (ordered: boolean) => {
    const tag = ordered ? 'ol' : 'ul';
    insertAtCursor(`\n<${tag}>\n  <li>Élément 1</li>\n  <li>Élément 2</li>\n  <li>Élément 3</li>\n</${tag}>\n`);
  };

  const insertBlockquote = () => {
    insertAtCursor('\n<blockquote>\n  Citation ou texte important\n</blockquote>\n');
  };

  const insertCode = () => {
    insertAtCursor('\n<pre><code>\n// Votre code ici\n</code></pre>\n');
  };

  const insertHorizontalRule = () => {
    insertAtCursor('\n<hr />\n');
  };

  const insertLink = () => {
    const url = prompt('URL du lien:', 'https://');
    if (url) {
      const textarea = textareaRef.current;
      const selectedText = textarea ? value.substring(textarea.selectionStart, textarea.selectionEnd) : '';
      insertAtCursor(`<a href="${url}" target="_blank">`, '</a>');
    }
  };

  const handleImageSelect = (url: string, alt: string = '') => {
    setImageModal({ isOpen: true, url, alt, caption: '' });
  };

  const insertImage = () => {
    const { url, alt, caption } = imageModal;
    if (!url) return;

    let imageHtml = `\n<figure class="blog-image">\n  <img src="${url}" alt="${alt || 'Image'}" />\n`;
    if (caption) {
      imageHtml += `  <figcaption>${caption}</figcaption>\n`;
    }
    imageHtml += `</figure>\n`;

    insertAtCursor(imageHtml);
    setImageModal({ isOpen: false, url: '', alt: '', caption: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Format non supporté. Utilisez JPG, PNG, GIF ou WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image trop volumineuse. Maximum 5 Mo.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Upload to server
      const result = await blogApi.uploadImage(file);
      setImageModal(prev => ({ ...prev, url: result.url, alt: file.name }));
    } catch (error) {
      console.error('Upload error:', error);
      // Fallback to data URL if upload fails
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageModal(prev => ({ ...prev, url: dataUrl, alt: file.name }));
      };
      reader.readAsDataURL(file);
      setUploadError('Erreur lors de l\'upload. Image utilisée localement.');
    } finally {
      setIsUploading(false);
    }
  };

  const ToolbarButton = ({
    icon: Icon,
    onClick,
    title,
    active = false,
  }: {
    icon: React.ElementType;
    onClick: () => void;
    title: string;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-primary-200 transition-colors ${
        active ? 'bg-primary-200 text-accent-600' : 'text-primary-600'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="border border-primary-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-primary-50 border-b border-primary-200">
        <div className="flex items-center gap-0.5 pr-2 border-r border-primary-300">
          <ToolbarButton icon={Bold} onClick={() => wrapSelection('strong')} title="Gras" />
          <ToolbarButton icon={Italic} onClick={() => wrapSelection('em')} title="Italique" />
          <ToolbarButton icon={Underline} onClick={() => wrapSelection('u')} title="Souligné" />
        </div>

        <div className="flex items-center gap-0.5 px-2 border-r border-primary-300">
          <ToolbarButton icon={Heading1} onClick={() => insertHeading(1)} title="Titre 1" />
          <ToolbarButton icon={Heading2} onClick={() => insertHeading(2)} title="Titre 2" />
          <ToolbarButton icon={Heading3} onClick={() => insertHeading(3)} title="Titre 3" />
        </div>

        <div className="flex items-center gap-0.5 px-2 border-r border-primary-300">
          <ToolbarButton icon={List} onClick={() => insertList(false)} title="Liste à puces" />
          <ToolbarButton icon={ListOrdered} onClick={() => insertList(true)} title="Liste numérotée" />
          <ToolbarButton icon={Quote} onClick={insertBlockquote} title="Citation" />
          <ToolbarButton icon={Code} onClick={insertCode} title="Code" />
        </div>

        <div className="flex items-center gap-0.5 px-2 border-r border-primary-300">
          <ToolbarButton icon={Link} onClick={insertLink} title="Lien" />
          <ToolbarButton
            icon={ImageIcon}
            onClick={() => setImageModal(prev => ({ ...prev, isOpen: true }))}
            title="Image"
          />
          <ToolbarButton icon={Minus} onClick={insertHorizontalRule} title="Ligne horizontale" />
        </div>

        <div className="flex items-center gap-0.5 pl-2 ml-auto">
          <ToolbarButton
            icon={isPreview ? Edit3 : Eye}
            onClick={() => setIsPreview(!isPreview)}
            title={isPreview ? "Éditer" : "Aperçu"}
            active={isPreview}
          />
        </div>
      </div>

      {/* Editor / Preview */}
      {isPreview ? (
        <div
          className="p-4 prose prose-primary max-w-none overflow-auto"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || '<p class="text-primary-400">Aucun contenu</p>') }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 resize-y font-mono text-sm focus:outline-none"
          style={{ minHeight }}
        />
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-primary-900">Insérer une image</h3>
              <button
                type="button"
                onClick={() => setImageModal({ isOpen: false, url: '', alt: '', caption: '' })}
                className="p-1 hover:bg-primary-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'library'
                      ? 'bg-accent-600 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  Bibliothèque
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'upload'
                      ? 'bg-accent-600 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'url'
                      ? 'bg-accent-600 text-white'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  URL
                </button>
              </div>

              {/* Tab Content */}
              <div className="max-h-80 overflow-y-auto">
                {activeTab === 'library' && (
                  <div className="space-y-4">
                    {STOCK_IMAGES.map((category) => (
                      <div key={category.category}>
                        <h4 className="text-sm font-medium text-primary-700 mb-2">{category.category}</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {category.images.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleImageSelect(img.url, img.alt)}
                              className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                imageModal.url === img.url
                                  ? 'border-accent-500 ring-2 ring-accent-200'
                                  : 'border-transparent hover:border-primary-300'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.alt}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'upload' && (
                  <div>
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isUploading
                          ? 'border-accent-300 bg-accent-50 cursor-wait'
                          : 'border-primary-300 cursor-pointer hover:border-accent-500'
                      }`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-12 w-12 text-accent-500 mx-auto mb-3 animate-spin" />
                          <p className="text-accent-600 font-medium">Upload en cours...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-primary-400 mx-auto mb-3" />
                          <p className="text-primary-600">Cliquez ou glissez une image</p>
                          <p className="text-sm text-primary-400 mt-1">JPG, PNG, GIF, WebP (max 5 Mo)</p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </div>
                    {uploadError && (
                      <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                    )}
                  </div>
                )}

                {activeTab === 'url' && (
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      URL de l'image
                    </label>
                    <input
                      type="url"
                      value={imageModal.url}
                      onChange={(e) => setImageModal(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                    />
                  </div>
                )}
              </div>

              {/* Image Preview & Options */}
              {imageModal.url && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                  <div className="flex gap-4">
                    <img
                      src={imageModal.url}
                      alt="Preview"
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">
                          Texte alternatif (alt)
                        </label>
                        <input
                          type="text"
                          value={imageModal.alt}
                          onChange={(e) => setImageModal(prev => ({ ...prev, alt: e.target.value }))}
                          placeholder="Description de l'image"
                          className="w-full px-3 py-1.5 border border-primary-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">
                          Légende (optionnel)
                        </label>
                        <input
                          type="text"
                          value={imageModal.caption}
                          onChange={(e) => setImageModal(prev => ({ ...prev, caption: e.target.value }))}
                          placeholder="Légende sous l'image"
                          className="w-full px-3 py-1.5 border border-primary-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t bg-primary-50">
              <button
                type="button"
                onClick={() => setImageModal({ isOpen: false, url: '', alt: '', caption: '' })}
                className="px-4 py-2 text-primary-700 hover:bg-primary-200 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={insertImage}
                disabled={!imageModal.url}
                className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insérer l'image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
