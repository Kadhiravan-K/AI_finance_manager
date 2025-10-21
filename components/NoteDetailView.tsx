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

const MarkdownPreview: React.FC<{ content: string; onCheckboxToggle: (lineIndex: number) => void }> = ({ content, onCheckboxToggle }) => {
    const lines = useMemo(() => (content || '').split('\n'), [content]);

    const renderInline = (text: string) => {
      // Basic inline parsing for bold, italic, and strikethrough
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/~~(.*?)~~/g, '<s>$1</s>');
    };

    return (
        <div className="p-6 w-full h-full text-primary space-y-2">
            {lines.map((line, index) => {
                // H1
                if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-3xl font-bold mt-4 pb-2 border-b border-divider">{line.substring(2)}</h1>;
                }
                // H2
                if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-bold mt-3 pb-1 border-b border-divider">{line.substring(3)}</h2>;
                }
                // Unchecked checkbox
                if (line.startsWith('- [ ] ')) {
                    return (
                        <div key={index} className="flex items-center gap-3 my-2 cursor-pointer group" onClick={() => onCheckboxToggle(index)}>
                            <div className="w-5 h-5 rounded border-2 border-divider bg-subtle flex-shrink-0 group-hover:border-accent-sky transition-colors"></div>
                            <span dangerouslySetInnerHTML={{ __html: renderInline(line.substring(6)) }} />
                        </div>
                    );
                }
                // Checked checkbox
                if (line.startsWith('- [x] ')) {
                    return (
                        <div key={index} className="flex items-center gap-3 my-2 cursor-pointer group" onClick={() => onCheckboxToggle(index)}>
                            <div className="w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <s className="text-secondary" dangerouslySetInnerHTML={{ __html: renderInline(line.substring(6)) }} />
                        </div>
                    );
                }
                // Bullet list item
                if (line.startsWith('- ')) {
                    return <div key={index} className="flex items-start gap-2 pl-4"><span className="text-emerald-400 mt-1">•</span><p dangerouslySetInnerHTML={{ __html: renderInline(line.substring(2)) }} /></div>;
                }
                // Numbered list item
                if (line.match(/^\d+\. /)) {
                    return <div key={index} className="flex items-start gap-2 pl-4"><span className="text-secondary font-semibold">{line.match(/^\d+\./)?.[0]}</span><p dangerouslySetInnerHTML={{ __html: renderInline(line.substring(line.indexOf(' ') + 1)) }} /></div>;
                }
                // Empty line
                if (line.trim() === '') {
                    return <div key={index} className="h-2"></div>;
                }

                // Default paragraph with inline markdown
                return <p key={index} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />;
            })}
        </div>
    );
};


interface NoteDetailViewProps {
  note: Note;
  onSave: (note: Note) => void;
  onBack: () => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const NoteDetailView: React.FC<NoteDetailViewProps> = ({ note, onSave, onBack, openModal }) => {
  const [currentNote, setCurrentNote] = useState<Note>(note);
  const [isPreview, setIsPreview] = useState(false);
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
        if (line.startsWith(syntax.start)) {
            newContent = before + line.substring(syntax.start.length) + after;
        } else {
            newContent = before + syntax.start + line + after;
        }
        setCurrentNote(p => ({ ...p, content: newContent }));

    } else {
        const selectedText = value.substring(selectionStart, selectionEnd);
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        const endSyntax = syntax.end || syntax.start;

        const newContent = `${before}${syntax.start}${selectedText}${endSyntax}${after}`;
        setCurrentNote(p => ({ ...p, content: newContent }));

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(selectionStart + syntax.start.length, selectionEnd + syntax.start.length);
        }, 0);
    }
  };

  const handleCheckboxToggle = (lineIndex: number) => {
    const content = typeof currentNote.content === 'string' ? currentNote.content : '';
    const lines = content.split('\n');
    const line = lines[lineIndex];

    if (line.startsWith('- [ ] ')) {
        lines[lineIndex] = line.replace('- [ ] ', '- [x] ');
    } else if (line.startsWith('- [x] ')) {
        lines[lineIndex] = line.replace('- [x] ', '- [ ] ');
    }

    const newContent = lines.join('\n');
    setCurrentNote(p => ({ ...p, content: newContent, updatedAt: new Date().toISOString() }));
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
        <div className="flex-grow"></div>
        <button onClick={() => setIsPreview(!isPreview)} className={`p-2 rounded-md text-sm font-semibold ${isPreview ? 'bg-emerald-500 text-white' : 'text-secondary hover:bg-subtle'}`}>
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      <div className="flex-grow flex flex-col overflow-y-auto">
        {isPreview ? (
          <MarkdownPreview 
            content={typeof currentNote.content === 'string' ? currentNote.content : ''} 
            onCheckboxToggle={handleCheckboxToggle} 
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={typeof currentNote.content === 'string' ? currentNote.content : ''}
            onChange={(e) => setCurrentNote(p => ({ ...p, content: e.target.value, updatedAt: new Date().toISOString() }))}
            placeholder="Start writing your note here... Use markdown for formatting!"
            className="w-full h-full bg-transparent p-6 text-primary resize-none focus:outline-none flex-grow"
          />
        )}
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
