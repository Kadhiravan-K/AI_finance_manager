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
            <button onClick={togglePin} className={`pin-button text-xl ${currentNote.isPinned ? 'pinned' : ''}`} title={currentNote.isPinned ? 'Unpin' : 'Pin'}>
                📌
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
        <MarkdownButton onClick={() => applyMarkdown({ start: '**', end: '**' })} title="Bold">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4.25-4H7v14h7.04c2.1 0 3.71-1.7 3.71-3.78 0-1.52-.86-2.82-2.15-3.43zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '*', end: '*' })} title="Italic">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '~~', end: '~~' })} title="Strikethrough">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"></path></svg>
        </MarkdownButton>
        <div className="h-5 w-px bg-divider mx-1"></div>
        <MarkdownButton onClick={() => applyMarkdown({ start: '# ', asLine: true })} title="Heading 1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3,4H5V10H9V4H11V18H9V12H5V18H3V4M14,18V16H16V9H18V16H20V18H14Z" /></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '## ', asLine: true })} title="Heading 2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3,4H5V10H9V4H11V18H9V12H5V18H3V4M21,18H15V16H17.5C18.35,16 19,15.35 19,14.5V12.5C19,11.65 18.35,11 17.5,11H15V9H19V11.5C19,12.35 19.65,13 20.5,13C21.35,13 22,12.35 22,11.5V9C22,7.9 21.1,7 20,7H15C13.9,7 13,7.9 13,9V14.5C13,16.45 14.55,18 16.5,18H21V18Z" /></svg>
        </MarkdownButton>
        <div className="h-5 w-px bg-divider mx-1"></div>
        <MarkdownButton onClick={() => applyMarkdown({ start: '- ', asLine: true })} title="Bulleted List">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"></path></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '1. ', asLine: true })} title="Numbered List">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '- [ ] ', asLine: true })} title="Checkbox">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8L10,17Z"></path></svg>
        </MarkdownButton>
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