import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Note } from '../types';
import ModalHeader from './ModalHeader';
import CustomSelect from './CustomSelect';
import { summarizeNote } from '../services/geminiService';
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
  grey: { bg: 'rgba(100, 116, 139, 0.2)', border: 'rgba(100, 116, 139, 0.5)'},
};

const EditNoteModal: React.FC<EditNoteModalProps> = ({ note, onSave, onCancel }) => {
  const isCreating = !note;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState(note?.tags.join(', ') || '');
  const [category, setCategory] = useState<'general' | 'glossary'>(note?.category || 'general');
  const [amount, setAmount] = useState(note?.amount?.toString() || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [color, setColor] = useState(note?.color || 'default');
  const [isSummarizing, setIsSummarizing] = useState(false);
  
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
  
  const handleInsertChecklist = () => {
      const newContent = content ? `${content}\n[ ] ` : '[ ] ';
      setContent(newContent);
      textareaRef.current?.focus();
  }

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
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent text-primary text-2xl font-bold focus:outline-none placeholder-tertiary"
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start writing..."
              className="w-full bg-transparent text-primary resize-none focus:outline-none placeholder-tertiary min-h-[10rem] overflow-hidden"
              rows={1}
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
                    <button type="button" onClick={handleInsertChecklist} title="Add Checklist Item" className="button-secondary p-2 rounded-full h-10 w-10">✓</button>
                    <button type="button" onClick={handleSummarize} disabled={isSummarizing} title="Summarize with AI" className="button-secondary p-2 rounded-full h-10 w-10 flex items-center justify-center">
                        {isSummarizing ? <LoadingSpinner /> : '✨'}
                    </button>
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