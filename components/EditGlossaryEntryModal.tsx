import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { GlossaryEntry } from '../types';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface EditGlossaryEntryModalProps {
  entry?: GlossaryEntry;
  onSave: (entry: Omit<GlossaryEntry, 'id'>, id?: string) => void;
  onClose: () => void;
}

const labelStyle = "block text-sm font-medium text-secondary mb-1";

const EditGlossaryEntryModal: React.FC<EditGlossaryEntryModalProps> = ({ entry, onSave, onClose }) => {
  const isCreating = !entry;
  
  const [formData, setFormData] = useState({
    term: entry?.term || '',
    emoji: entry?.emoji || '💡',
    definition: entry?.definition || '',
    usageLogic: entry?.usageLogic || '',
    example: entry?.example || '',
    tags: entry?.tags.join(', ') || '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.term.trim() && formData.definition.trim()) {
      onSave({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      }, entry?.id);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title={isCreating ? "Add Glossary Term" : "Edit Glossary Term"} onClose={onClose} />
        <form onSubmit={handleSubmit} className="space-y-4 p-6 overflow-y-auto">
          <div className="flex items-start gap-3">
             <div>
              <label htmlFor="emoji" className={labelStyle}>Emoji</label>
              <input type="text" id="emoji" value={formData.emoji} onChange={e => handleChange('emoji', e.target.value)} maxLength={2} className="input-base w-16 rounded-lg py-2 px-3 text-center" />
            </div>
            <div className="flex-grow">
              <label htmlFor="term" className={labelStyle}>Term</label>
              <input type="text" id="term" value={formData.term} onChange={e => handleChange('term', e.target.value)} className="input-base w-full rounded-lg py-2 px-3" required autoFocus />
            </div>
          </div>
          <div>
            <label htmlFor="definition" className={labelStyle}>Definition</label>
            <textarea id="definition" value={formData.definition} onChange={e => handleChange('definition', e.target.value)} rows={2} className="input-base w-full rounded-lg py-2 px-3 resize-none" required />
          </div>
          <div>
            <label htmlFor="usageLogic" className={labelStyle}>Usage Logic</label>
            <textarea id="usageLogic" value={formData.usageLogic} onChange={e => handleChange('usageLogic', e.target.value)} rows={3} className="input-base w-full rounded-lg py-2 px-3 resize-none" />
          </div>
           <div>
            <label htmlFor="example" className={labelStyle}>Example</label>
            <textarea id="example" value={formData.example} onChange={e => handleChange('example', e.target.value)} rows={2} className="input-base w-full rounded-lg py-2 px-3 resize-none" />
          </div>
          <div>
            <label htmlFor="tags" className={labelStyle}>Tags (comma-separated)</label>
            <input type="text" id="tags" value={formData.tags} onChange={e => handleChange('tags', e.target.value)} className="input-base w-full rounded-lg py-2 px-3" />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2">Cancel</button>
            <button type="submit" className="button-primary px-4 py-2">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
  
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default EditGlossaryEntryModal;