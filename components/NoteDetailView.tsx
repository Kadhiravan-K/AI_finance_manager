

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Note, ActiveModal } from '../types';
import { processNoteWithAI } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { highlightMarkdown } from '../utils/markdown';

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

const slashCommands = [
    { icon: 'H₁', name: 'Heading 1', command: '# ' },
    { icon: 'H₂', name: 'Heading 2', command: '## ' },
    { icon: '•', name: 'Bulleted List', command: '- ' },
    { icon: '1.', name: 'Numbered List', command: '1. ' },
    { icon: '>', name: 'Quote', command: '> ' },
    { icon: '💡', name: 'Callout', command: '> [!NOTE] ' },
    { icon: '``', name: 'Code Block', command: '```\n\n```' },
    { icon: '---', name: 'Divider', command: '---\n' },
];


interface NoteDetailViewProps {
  note: Note;
  onSave: (note: Note) => void;
  onBack: () => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const NoteDetailView: React.FC<NoteDetailViewProps> = ({ note, onSave, onBack, openModal }) => {
  const [currentNote, setCurrentNote] = useState<Note>(note);
  const [isEditingIcon, setIsEditingIcon] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iconInputRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  const [slashMenu, setSlashMenu] = useState<{ open: boolean; position: { top: number, left: number } | null; activeIndex: number }>({ open: false, position: null, activeIndex: 0 });
  const [selectionToolbar, setSelectionToolbar] = useState<{ open: boolean; position: { top: number, left: number } | null }>({ open: false, position: null });

  useEffect(() => {
    setCurrentNote(note);
    setUndoStack([note.content as string]);
    setRedoStack([]);
  }, [note]);
  
  // Debounced save
  useEffect(() => {
    const handler = setTimeout(() => {
      if (JSON.stringify(note) !== JSON.stringify(currentNote)) {
        onSave(currentNote);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [currentNote, note, onSave]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (iconInputRef.current && !iconInputRef.current.contains(event.target as Node)) {
        setIsEditingIcon(false);
      }
    }
    if (isEditingIcon) {
      document.addEventListener("mousedown", handleClickOutside);
      iconInputRef.current?.querySelector('input')?.focus();
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditingIcon]);

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
    const updatedNote = { ...currentNote, isPinned: !currentNote.isPinned };
    setCurrentNote(updatedNote);
    onSave(updatedNote);
  };
  
  const handleUndo = useCallback(() => {
    if (undoStack.length > 1) {
      const newUndoStack = [...undoStack];
      const currentState = newUndoStack.pop() as string;
      const prevState = newUndoStack[newUndoStack.length - 1];
      setRedoStack(prev => [currentState, ...prev]);
      setCurrentNote(p => ({ ...p, content: prevState }));
      setUndoStack(newUndoStack);
    }
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const newRedoStack = [...redoStack];
      const nextState = newRedoStack.shift() as string;
      setUndoStack(prev => [...prev, nextState]);
      setCurrentNote(p => ({ ...p, content: nextState }));
      setRedoStack(newRedoStack);
    }
  }, [redoStack]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !textareaRef.current) return;

    setIsAiLoading(true);
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd, value } = textarea;

    const hasSelection = selectionStart !== selectionEnd;
    const textToProcess = hasSelection ? value.substring(selectionStart, selectionEnd) : value;

    try {
        const result = await processNoteWithAI(textToProcess, aiPrompt);
        
        let newContent;
        if (hasSelection) {
            const before = value.substring(0, selectionStart);
            const after = value.substring(selectionEnd);
            newContent = `${before}${result}${after}`;
        } else {
            newContent = result;
        }

        handleContentChange(newContent, true);

    } catch (error) {
        console.error("AI processing failed:", error);
        alert("Sorry, the AI feature failed. Please try again.");
    } finally {
        setIsAiLoading(false);
        setShowAiPrompt(false);
        setAiPrompt('');
    }
  };

  const applyMarkdown = (syntax: { start: string, end?: string }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);
    
    const selectedText = value.substring(selectionStart, selectionEnd);
    const endSyntax = syntax.end ?? syntax.start;
    const newContent = `${before}${syntax.start}${selectedText}${endSyntax}${after}`;
    handleContentChange(newContent, true);

    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart + syntax.start.length, selectionEnd + syntax.start.length);
    }, 0);
  };

  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
        applyMarkdown({ start: '[', end: `](${url})` });
    }
    setSelectionToolbar({ open: false, position: null });
  };
  
  const handleContentChange = (content: string, fromCode: boolean = false) => {
    setCurrentNote(p => ({ ...p, content: content, updatedAt: new Date().toISOString() }));

    if (fromCode) {
        setUndoStack(prev => [...prev.slice(-20), content]);
        setRedoStack([]);
    }
  };
  
  const handleUserTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setCurrentNote(p => ({ ...p, content: content, updatedAt: new Date().toISOString() }));
    setUndoStack(prev => [...prev.slice(-20), content]);
    setRedoStack([]);
  }

  const handleSelectSlashCommand = (command: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, value } = textarea;
    
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const currentLine = value.substring(lineStart, selectionStart);
    const slashIndex = currentLine.lastIndexOf('/');

    if (slashIndex !== -1) {
        const before = value.substring(0, lineStart + slashIndex);
        const after = value.substring(selectionStart);
        
        let newContent = `${before}${command}${after}`;
        let newCursorPos = before.length + command.length;
        
        if (command.includes('```')) {
            newCursorPos -= 3; // Position cursor inside the code block
        }

        handleContentChange(newContent, true);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    }
    setSlashMenu({ open: false, position: null, activeIndex: 0 });
  };
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Undo/Redo
    if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z') {
            e.preventDefault();
            handleUndo();
        } else if (e.key === 'y') {
            e.preventDefault();
            handleRedo();
        } else if (e.key === 'b') {
            e.preventDefault();
            applyMarkdown({ start: '**' });
        } else if (e.key === 'i') {
            e.preventDefault();
            applyMarkdown({ start: '*' });
        }
    }
    
    // Auto-list
    if (e.key === 'Enter') {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const { selectionStart, value } = textarea;
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const currentLine = value.substring(lineStart, selectionStart);

        const bulletMatch = currentLine.match(/^(\s*)-\s/);
        const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
        
        if (bulletMatch && currentLine.trim() === '-') {
             // Remove empty bullet point
            e.preventDefault();
            const before = value.substring(0, lineStart);
            const after = value.substring(selectionStart);
            handleContentChange(`${before}${after}`, true);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(lineStart, lineStart);
            }, 0);
            return;
        }

        if (bulletMatch) {
            e.preventDefault();
            const newContent = `${value.substring(0, selectionStart)}\n${bulletMatch[1]}- ${value.substring(selectionStart)}`;
            handleContentChange(newContent, true);
             setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(selectionStart + 4, selectionStart + 4);
            }, 0);
        } else if (numberMatch) {
             e.preventDefault();
             const nextNumber = parseInt(numberMatch[2], 10) + 1;
             const newContent = `${value.substring(0, selectionStart)}\n${numberMatch[1]}${nextNumber}. ${value.substring(selectionStart)}`;
             handleContentChange(newContent, true);
             setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(selectionStart + 5, selectionStart + 5);
            }, 0);
        }
    }

    // Slash menu navigation
    if (slashMenu.open) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSlashMenu(p => ({ ...p, activeIndex: (p.activeIndex + 1) % slashCommands.length }));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSlashMenu(p => ({ ...p, activeIndex: (p.activeIndex - 1 + slashCommands.length) % slashCommands.length }));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelectSlashCommand(slashCommands[slashMenu.activeIndex].command);
        } else if (e.key === 'Escape') {
            setSlashMenu({ open: false, position: null, activeIndex: 0 });
        }
    }

  }, [handleUndo, handleRedo, slashMenu]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (textarea && highlight) {
        highlight.innerHTML = highlightMarkdown(currentNote.content as string);
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
        highlight.style.height = `${textarea.scrollHeight}px`;
    }
  }, [currentNote.content]);
  
  useEffect(() => {
    const handleCopy = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.matches('.copy-code-btn')) {
            const content = target.getAttribute('data-copy-content');
            if (content) {
                navigator.clipboard.writeText(content).then(() => {
                    target.textContent = 'Copied!';
                    setTimeout(() => { target.textContent = 'Copy'; }, 2000);
                });
            }
        }
    };
    document.addEventListener('click', handleCopy);
    return () => document.removeEventListener('click', handleCopy);
  }, []);

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-divider flex-shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <button onClick={handleSaveAndBack} className="p-2 -ml-2 text-secondary hover:text-primary rounded-full flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div ref={iconInputRef} className="relative">
              {isEditingIcon ? (
                  <input type="text" value={currentNote.icon} onChange={e => setCurrentNote(p => ({...p, icon: e.target.value}))} maxLength={2} className="w-12 text-2xl bg-subtle rounded-md text-center p-1" />
              ) : ( <button onClick={() => setIsEditingIcon(true)} className="text-3xl p-1 rounded-md hover:bg-subtle">{currentNote.icon || '📝'}</button> )}
          </div>
          <input 
            type="text" 
            value={currentNote.title}
            onChange={(e) => setCurrentNote(p => ({ ...p, title: e.target.value }))}
            className="bg-transparent text-xl font-bold text-primary focus:outline-none w-full"
          />
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
            <button onClick={togglePin} className={`pin-button ${currentNote.isPinned ? 'pinned' : ''}`} title={currentNote.isPinned ? 'Unpin' : 'Pin'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24" fill="currentColor">
                <path transform="rotate(45 12 12)" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.5V22H12.5V16H18V14L16,12Z" />
              </svg>
            </button>
            <button onClick={handleLinkToTrip} className="button-secondary p-2 rounded-full aspect-square" title="Link to Trip">
                ✈️
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto relative">
        <div 
            ref={highlightRef}
            className="note-editor-text markdown-preview absolute inset-0 pointer-events-none text-transparent"
        ></div>
        <textarea
            ref={textareaRef}
            value={currentNote.content as string}
            onChange={handleUserTyping}
            onKeyDown={handleKeyDown}
            className="note-editor-text w-full h-full bg-transparent resize-none focus:outline-none caret-primary text-primary"
            placeholder="Start writing..."
            autoFocus
        />
      </div>
       <div className="flex-shrink-0 p-2 border-t border-divider bg-subtle flex justify-between items-center text-xs text-secondary">
          <span>{wordCount} words</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAiPrompt(!showAiPrompt)} title="AI Actions" className="p-1.5 rounded-md hover:bg-subtle text-violet-400">✨</button>
            <button onClick={handleUndo} disabled={undoStack.length <= 1} title="Undo (Ctrl+Z)" className="p-1.5 rounded-md hover:bg-subtle disabled:opacity-50">↩️</button>
            <button onClick={handleRedo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)" className="p-1.5 rounded-md hover:bg-subtle disabled:opacity-50">↪️</button>
          </div>
      </div>
      {showAiPrompt && (
        <form onSubmit={handleAiSubmit} className="p-2 border-t border-divider flex items-center gap-2">
            <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., summarize, fix grammar, make it shorter..." className="input-base w-full p-2 rounded-full" autoFocus/>
            <button type="submit" className="button-primary px-4 py-2" disabled={isAiLoading}>{isAiLoading ? <LoadingSpinner/> : 'Submit'}</button>
        </form>
      )}
    </div>
  );
};

export default NoteDetailView;
