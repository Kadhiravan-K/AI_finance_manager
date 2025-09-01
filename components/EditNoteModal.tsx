import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Note } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { summarizeNote, analyzeImageForNote } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ToggleSwitch from './ToggleSwitch';

const modalRoot = document.getElementById('modal-root')!;

interface EditNoteModalProps {
  note?: Note;
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>, id?: string) => void;
  onCancel: () => void;
}

const NOTE_COLORS: Record<string, { bg: string, border: string }> = {
  default: { bg: 'var(--color-bg-card)', border: 'var(--color-border-card)'},
  red: { bg: 'rgba(244, 63, 94, 0.2)', border: 'rgba(244, 63, 94, 0.5)'},
  orange: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.5)'},
  yellow: { bg: 'rgba(234, 179, 8, 0.2)', border: 'rgba(234, 179, 8, 0.5)'},
  green: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)'},
  blue: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.5)'},
  purple: { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgba(139, 92, 246, 0.5)'},
  grey: { bg: 'rgba(100, 116, 139, 0.2)', border: 'rgba(100, 116, 139, 0.4)'},
};

const MarkdownToolbar: React.FC<{ onAction: (action: 'bold' | 'italic' | 'strikethrough' | 'ul' | 'ol' | 'checklist' | 'image') => void }> = ({ onAction }) => {
    return (
        <div className="markdown-toolbar">
            <button type="button" onClick={() => onAction('bold')} title="Bold"><b>B</b></button>
            <button type="button" onClick={() => onAction('italic')} title="Italic"><i>I</i></button>
            <button type="button" onClick={() => onAction('strikethrough')} title="Strikethrough"><del>S</del></button>
            <button type="button" onClick={() => onAction('ul')} title="Unordered List">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
             <button type="button" onClick={() => onAction('ol')} title="Ordered List">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
            </button>
            <button type="button" onClick={() => onAction('checklist')} title="Checklist">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </button>
             <button type="button" onClick={() => onAction('image')} title="Attach Image">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </button>
        </div>
    );
};


const EditNoteModal: React.FC<EditNoteModalProps> = ({ note, onSave, onCancel }) => {
  const isCreating = !note;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState(note?.tags.join(', ') || '');
  const [category, setCategory] = useState<'general' | 'glossary'>(note?.category || 'general');
  const [amount, setAmount] = useState(note?.amount?.toString() || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [color, setColor] = useState(note?.color || 'default');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [image, setImage] = useState<{ data: string; mimeType: string; } | null>(note?.image || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim() || undefined,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      category,
      amount: category === 'glossary' ? parseFloat(amount) || undefined : undefined,
      isPinned,
      color,
      image: image,
    }, note?.id);
  };
  
  const handleSummarize = async () => {
      if (!content.trim()) return;
      setIsSummarizing(true);
      try {
          const summaryPoints = await summarizeNote(content);
          const summaryText = summaryPoints.map(p => `- ${p}`).join('\n');
          setContent(prev => `${prev}\n\n---\n**AI Summary:**\n${summaryText}`);
      } catch (error) {
          alert("Failed to get summary.");
      }
      setIsSummarizing(false);
  };

  const handleImageAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const [meta, base64Data] = result.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        if (base64Data) {
          setImage({ data: base64Data, mimeType });
        }
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  };

  const handleAnalyzeImage = async () => {
      if (!image) return;
      setIsAnalyzing(true);
      try {
          const analysis = await analyzeImageForNote(image, "Analyze this image for the note.");
          setContent(prev => `${prev}\n\n---\n**Image Analysis:**\n${analysis}`);
      } catch (err) {
          alert(err instanceof Error ? err.message : "Failed to analyze image.");
      }
      setIsAnalyzing(false);
  };

  const handleToolbarAction = (action: 'bold' | 'italic' | 'strikethrough' | 'ul' | 'ol' | 'checklist' | 'image') => {
    if (action === 'image') {
        fileInputRef.current?.click();
        return;
    }
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = '';
    let cursorPosition = start;

    switch (action) {
      case 'bold':
        newText = `**${selectedText}**`;
        cursorPosition = start + 2;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        cursorPosition = start + 1;
        break;
      case 'strikethrough':
        newText = `~~${selectedText}~~`;
        cursorPosition = start + 2;
        break;
      case 'ul':
        newText = `\n- ${selectedText}`;
        cursorPosition = start + 3;
        break;
      case 'ol':
        newText = `\n1. ${selectedText}`;
        cursorPosition = start + 4;
        break;
      case 'checklist':
        newText = `\n[ ] ${selectedText}`;
        cursorPosition = start + 5;
        break;
    }

    const updatedContent = content.substring(0, start) + newText + content.substring(end);
    setContent(updatedContent);

    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = cursorPosition;
        textarea.selectionEnd = cursorPosition + selectedText.length;
    }, 0);
  };
  
  const categoryOptions = [
    { value: 'general', label: 'General Note' },
    { value: 'glossary', label: 'Glossary Item' },
  ];
  
  const modalStyle = {
      backgroundColor: NOTE_COLORS[color]?.bg || NOTE_COLORS.default.bg,
      borderColor: NOTE_COLORS[color]?.border || NOTE_COLORS.default.border,
  };
  
  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border animate-scaleIn transition-colors" style={modalStyle} onClick={e => e.stopPropagation()}>
        <ModalHeader title={isCreating ? "New Note" : "Edit Note"} onClose={onCancel} />
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-6 pt-2 space-y-4">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent text-primary text-2xl font-bold focus:outline-none placeholder-tertiary"
            />
             <MarkdownToolbar onAction={handleToolbarAction} />
             <input type="file" ref={fileInputRef} onChange={handleImageAttach} accept="image/*" className="hidden" />
              {image && (
                  <div className="note-image-preview">
                      <img src={`data:${image.mimeType};base64,${image.data}`} alt="preview" />
                      <button type="button" onClick={() => setImage(null)} className="note-image-preview-remove">&times;</button>
                  </div>
              )}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start writing..."
              className="w-full bg-transparent text-primary resize-none focus:outline-none placeholder-tertiary min-h-[10rem] overflow-hidden"
              rows={1}
              style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: '1rem' }}
            />
             <input
              type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="Tags (comma-separated)..."
              className="w-full bg-transparent text-sm text-secondary focus:outline-none placeholder-tertiary"
            />
            {category === 'glossary' && (
              <input
                type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Amount (e.g., 150)"
                className="w-full input-base p-2 rounded-md no-spinner mt-2"
              />
            )}
          </div>

          <div className="flex-shrink-0 p-3 border-t border-divider bg-subtle/50 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <button type="button" onClick={handleSummarize} disabled={isSummarizing} title="Summarize with AI" className="button-secondary p-2 rounded-full h-10 w-10 flex items-center justify-center">
                        {isSummarizing ? <LoadingSpinner /> : '✨'}
                    </button>
                    {image && (
                        <button type="button" onClick={handleAnalyzeImage} disabled={isAnalyzing} title="Analyze Image with AI" className="button-secondary p-2 rounded-full h-10 w-10 flex items-center justify-center">
                            {isAnalyzing ? <LoadingSpinner /> : '👁️'}
                        </button>
                    )}
                    <CustomSelect options={categoryOptions} value={category} onChange={val => setCategory(val as 'general' | 'glossary')} />
                </div>
                 <ToggleSwitch checked={isPinned} onChange={setIsPinned} label="Pin" />
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Object.keys(NOTE_COLORS).map(colorKey => (
                        <button key={colorKey} type="button" onClick={() => setColor(colorKey)} className={`w-7 h-7 rounded-full transition-transform ${color === colorKey ? 'scale-110 ring-2 ring-white/80' : ''}`} style={{ backgroundColor: NOTE_COLORS[colorKey].bg, border: `2px solid ${NOTE_COLORS[colorKey].border}` }}></button>
                    ))}
                </div>
                <button type="submit" className="button-primary px-4 py-2">Save Note</button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditNoteModal;