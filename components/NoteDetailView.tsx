import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Note, ActiveModal } from '../types';

interface MarkdownButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}

const MarkdownButton: React.FC<MarkdownButtonProps> = ({ onClick, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="p-2 rounded-md hover:bg-subtle text-secondary hover:text-primary transition-colors"
  >
    {children}
  </button>
);


interface NoteDetailViewProps {
  note: Note;
  onSave: (note: Note) => void;
  onBack: () => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const NoteDetailView: React.FC<NoteDetailViewProps> = ({ note, onSave, onBack, openModal }) => {
  const [currentNote, setCurrentNote] = useState<Note>(note);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentNote(note);
  }, [note]);

  const wordCount = useMemo(() => {
    if (typeof currentNote.content !== 'string') return 0;
    return currentNote.content.trim().split(/\s+/).filter(Boolean).length;
  }, [currentNote.content]);

  const handleSaveAndBack = () => {
    onSave(currentNote);
    onBack();
  };
  
  const handleLinkToTrip = () => {
    openModal('linkToTrip', { note: currentNote, onSave });
  };
  
  const togglePin = () => {
    setCurrentNote(p => ({ ...p, isPinned: !p.isPinned }));
  };
  
  const applyMarkdown = (syntax: { start: string, end?: string, asLine?: boolean }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    
    // Logic for formatting an entire line (e.g., headers, list items)
    if (syntax.asLine) {
        let lineStart = selectionStart;
        while (lineStart > 0 && value[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        let lineEnd = value.indexOf('\n', selectionStart);
        if (lineEnd === -1) lineEnd = value.length;

        const before = value.substring(0, lineStart);
        const line = value.substring(lineStart, lineEnd);
        const after = value.substring(lineEnd);
        
        let newContent;
        // Toggle: if syntax already exists, remove it
        if (line.startsWith(syntax.start)) {
            newContent = before + line.substring(syntax.start.length) + after;
        } else {
            newContent = before + syntax.start + line + after;
        }
        setCurrentNote(p => ({ ...p, content: newContent }));

    } else { // Logic for wrapping selected text
        const selectedText = value.substring(selectionStart, selectionEnd);
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        const endSyntax = syntax.end || syntax.start;

        const newContent = `${before}${syntax.start}${selectedText}${endSyntax}${after}`;
        setCurrentNote(p => ({ ...p, content: newContent }));

        // Re-focus and adjust selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(selectionStart + syntax.start.length, selectionEnd + syntax.start.length);
        }, 0);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <button onClick={handleSaveAndBack} className="p-2 -ml-2 text-secondary hover:text-primary rounded-full flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <input 
            type="text" 
            value={currentNote.title}
            onChange={(e) => setCurrentNote(p => ({ ...p, title: e.target.value }))}
            className="bg-transparent text-xl font-bold text-primary focus:outline-none w-full"
          />
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
            <button onClick={togglePin} className={`pin-button ${currentNote.isPinned ? 'pinned' : ''}`} title={currentNote.isPinned ? 'Unpin' : 'Pin'}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v12.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 16.586V4a1 1 0 011-1z" clipRule="evenodd" transform="rotate(-45 10 10)" /></svg>
            </button>
            <button onClick={handleLinkToTrip} className="button-secondary p-2 rounded-full aspect-square" title="Link to Trip">
                ✈️
            </button>
            <button onClick={handleSaveAndBack} className="button-primary px-4 py-2">
                Save
            </button>
        </div>
      </div>
      <div className="markdown-toolbar flex items-center gap-1 p-2 border-b border-divider flex-shrink-0">
        <MarkdownButton onClick={() => applyMarkdown({ start: '**', end: '**' })} title="Bold"><strong>B</strong></MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '*', end: '*' })} title="Italic"><em>I</em></MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '~~', end: '~~' })} title="Strikethrough"><del>S</del></MarkdownButton>
        <div className="h-5 w-px bg-divider mx-1"></div>
        <MarkdownButton onClick={() => applyMarkdown({ start: '# ', asLine: true })} title="Heading 1">H1</MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '## ', asLine: true })} title="Heading 2">H2</MarkdownButton>
        <div className="h-5 w-px bg-divider mx-1"></div>
        <MarkdownButton onClick={() => applyMarkdown({ start: '- ', asLine: true })} title="Bulleted List">●</MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '1. ', asLine: true })} title="Numbered List">1.</MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '- [ ] ', asLine: true })} title="Checkbox">✓</MarkdownButton>
      </div>
      <div className="flex-grow flex flex-col">
        <textarea
          ref={textareaRef}
          value={typeof currentNote.content === 'string' ? currentNote.content : ''}
          onChange={(e) => setCurrentNote(p => ({ ...p, content: e.target.value, updatedAt: new Date().toISOString() }))}
          placeholder="Start writing your note here..."
          className="w-full h-full bg-transparent p-6 text-primary resize-none focus:outline-none flex-grow"
        />
      </div>
      <div className="p-2 border-t border-divider flex-shrink-0 text-xs text-secondary text-right">
        <span>{wordCount} words</span>
        <span className="mx-2">•</span>
        <span>Last updated: {new Date(currentNote.updatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default NoteDetailView;
