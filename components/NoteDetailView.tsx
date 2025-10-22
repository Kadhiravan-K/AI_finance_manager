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
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/~~(.*?)~~/g, '<s>$1</s>');
    };

    const CopyButton: React.FC<{ text: string }> = ({ text }) => {
        const [copied, setCopied] = useState(false);
        const handleCopy = (e: React.MouseEvent) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text.trim()).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        };
        return (
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-card-strong rounded-md text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
            >
                {copied ? 'Copied!' : 'Copy'}
            </button>
        );
    };

    const renderElements = () => {
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeBlockContent = '';
        let codeBlockStartIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    elements.push(
                        <div key={`code-${codeBlockStartIndex}`} className="relative group my-2">
                            <pre className="bg-subtle p-4 rounded-lg overflow-x-auto font-mono text-sm">
                                <code>{codeBlockContent}</code>
                            </pre>
                            <CopyButton text={codeBlockContent} />
                        </div>
                    );
                    inCodeBlock = false;
                    codeBlockContent = '';
                } else {
                    inCodeBlock = true;
                    codeBlockStartIndex = i;
                }
                continue;
            }

            if (inCodeBlock) {
                codeBlockContent += line + '\n';
                continue;
            }
            
            if (line.startsWith('# ')) {
                elements.push(<h1 key={i} className="text-3xl font-bold mt-4 pb-2 border-b border-divider">{line.substring(2)}</h1>);
            } else if (line.startsWith('## ')) {
                elements.push(<h2 key={i} className="text-2xl font-bold mt-3 pb-1 border-b border-divider">{line.substring(3)}</h2>);
            } else if (line.startsWith('- [ ] ')) {
                elements.push(
                    <div key={i} className="flex items-center gap-3 my-2 cursor-pointer group" onClick={(e) => { e.stopPropagation(); onCheckboxToggle(i); }}>
                        <div className="w-5 h-5 rounded border-2 border-divider bg-subtle flex-shrink-0 group-hover:border-accent-sky transition-colors"></div>
                        <span dangerouslySetInnerHTML={{ __html: renderInline(line.substring(6)) }} />
                    </div>
                );
            } else if (line.startsWith('- [x] ')) {
                elements.push(
                    <div key={i} className="flex items-center gap-3 my-2 cursor-pointer group" onClick={(e) => { e.stopPropagation(); onCheckboxToggle(i); }}>
                        <div className="w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <s className="text-secondary" dangerouslySetInnerHTML={{ __html: renderInline(line.substring(6)) }} />
                    </div>
                );
            } else if (line.startsWith('- ')) {
                elements.push(<div key={i} className="flex items-start gap-2 pl-4"><span className="text-emerald-400 mt-1">•</span><p dangerouslySetInnerHTML={{ __html: renderInline(line.substring(2)) }} /></div>);
            } else if (line.match(/^\d+\. /)) {
                elements.push(<div key={i} className="flex items-start gap-2 pl-4"><span className="text-secondary font-semibold">{line.match(/^\d+\./)?.[0]}</span><p dangerouslySetInnerHTML={{ __html: renderInline(line.substring(line.indexOf(' ') + 1)) }} /></div>);
            } else if (line.trim() === '') {
                elements.push(<div key={i} className="h-2"></div>);
            } else {
                elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />);
            }
        }
        
        if (inCodeBlock) {
             elements.push(
                <div key={`code-${codeBlockStartIndex}`} className="relative group my-2">
                    <pre className="bg-subtle p-4 rounded-lg overflow-x-auto font-mono text-sm">
                        <code>{codeBlockContent}</code>
                    </pre>
                    <CopyButton text={codeBlockContent} />
                </div>
            );
        }

        return elements;
    };

    return (
        <div className="p-6 w-full h-full text-primary space-y-2">
            {renderElements()}
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
  const [isPreview, setIsPreview] = useState(true);
  const [isEditingIcon, setIsEditingIcon] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iconInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentNote(note);
    setIsPreview(true);
  }, [note]);

  useEffect(() => {
    if (!isPreview) {
        textareaRef.current?.focus();
    }
  }, [isPreview]);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (iconInputRef.current && !iconInputRef.current.contains(event.target as Node)) {
        setIsEditingIcon(false);
      }
    }
    if (isEditingIcon) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingIcon]);

  useEffect(() => {
    if (isEditingIcon) {
        iconInputRef.current?.querySelector('input')?.focus();
    }
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
    onSave(updatedNote); // Save immediately on pin
  };
  
  const applyMarkdown = (syntax: { start: string, end?: string, asLine?: boolean, insert?: boolean }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const before = value.substring(0, selectionStart);
    const after = value.substring(selectionEnd);
    
    if (syntax.insert) {
        const newContent = `${before}${syntax.start}${after}`;
        setCurrentNote(p => ({ ...p, content: newContent }));
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(selectionStart + syntax.start.length, selectionStart + syntax.start.length);
        }, 0);
        return;
    }
    
    if (syntax.asLine) {
        let lineStart = selectionStart;
        while (lineStart > 0 && value[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        let lineEnd = value.indexOf('\n', selectionStart);
        if (lineEnd === -1) lineEnd = value.length;

        const beforeLine = value.substring(0, lineStart);
        const line = value.substring(lineStart, lineEnd);
        const afterLine = value.substring(lineEnd);
        
        let newContent;
        if (line.startsWith(syntax.start)) {
            newContent = beforeLine + line.substring(syntax.start.length) + afterLine;
        } else {
            newContent = beforeLine + syntax.start + line + afterLine;
        }
        setCurrentNote(p => ({ ...p, content: newContent }));

    } else {
        const selectedText = value.substring(selectionStart, selectionEnd);
        const endSyntax = syntax.end ?? syntax.start;

        const newContent = `${before}${syntax.start}${selectedText}${endSyntax}${after}`;
        setCurrentNote(p => ({ ...p, content: newContent }));

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(selectionStart + syntax.start.length, selectionEnd + syntax.start.length);
        }, 0);
    }
  };
  
  const handleContentChange = (content: string) => {
    const commandMap: { [key: string]: string } = {
        '/h1 ': '# ', '/h2 ': '## ', '/todo ': '- [ ] ', '/list ': '- ', '/num ': '1. ', '/-- ': '\n---\n',
    };

    let commandApplied = false;
    for (const command in commandMap) {
        if (content.endsWith(command)) {
            const newContent = content.slice(0, -command.length) + commandMap[command];
            setCurrentNote(p => ({ ...p, content: newContent, updatedAt: new Date().toISOString() }));
            commandApplied = true;
            break;
        }
    }
    
    if (!commandApplied) {
        setCurrentNote(p => ({ ...p, content: content, updatedAt: new Date().toISOString() }));
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
    const updatedNote = { ...currentNote, content: newContent, updatedAt: new Date().toISOString() };
    setCurrentNote(updatedNote);
    onSave(updatedNote); // Auto-save on checkbox toggle
  };

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-divider flex-shrink-0 flex items-start justify-between gap-4">
        <div className="flex items-start gap-2 flex-grow min-w-0">
          <button onClick={handleSaveAndBack} className="p-2 -ml-2 text-secondary hover:text-primary rounded-full flex-shrink-0 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex flex-col gap-2 flex-grow">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setIsEditingIcon(true)} className="text-4xl w-12 h-12 flex items-center justify-center rounded-lg hover:bg-subtle transition-colors">
                  {currentNote.icon || '📝'}
                </button>
                {isEditingIcon && (
                    <div ref={iconInputRef} className="absolute top-0 left-0 z-10 p-2 bg-card-strong rounded-lg shadow-lg border border-divider">
                        <input
                            type="text"
                            value={currentNote.icon || ''}
                            onChange={(e) => setCurrentNote(p => ({...p, icon: e.target.value.slice(0, 2)}))}
                            className="w-16 text-4xl text-center bg-subtle rounded-md"
                        />
                    </div>
                )}
              </div>
              <input 
                type="text" 
                value={currentNote.title}
                onChange={(e) => setCurrentNote(p => ({ ...p, title: e.target.value, updatedAt: new Date().toISOString() }))}
                className="bg-transparent text-xl font-bold text-primary focus:outline-none w-full"
              />
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 mt-2">
            <button onClick={togglePin} className={`pin-button ${currentNote.isPinned ? 'pinned' : ''}`} title={currentNote.isPinned ? 'Unpin' : 'Pin'}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path transform="rotate(45 12 12)" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.5V22H12.5V16H18V14L16,12Z" />
              </svg>
            </button>
            <button onClick={handleLinkToTrip} className="button-secondary p-2 rounded-full aspect-square" title="Link to Trip">
                ✈️
            </button>
        </div>
      </div>
      <div className="markdown-toolbar flex items-center gap-1 p-2 border-b border-divider flex-shrink-0">
        <MarkdownButton onClick={() => applyMarkdown({ start: '**', end: '**' })} title="Bold">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4.25-4H7v14h7.04c2.1 0 3.71-1.7 3.71-3.78 0-1.52-.86-2.82-2.15-3.43zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '*', end: '*' })} title="Italic">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '~~', end: '~~' })} title="Strikethrough">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"></path></svg>
        </MarkdownButton>
        <div className="divider"></div>
        <MarkdownButton onClick={() => applyMarkdown({ start: '# ', asLine: true })} title="Heading 1">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18V4h2v7h5V4h2v14h-2v-5H5v5H3Z" /></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '## ', asLine: true })} title="Heading 2">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18V4h2v7h5V4h2v14h-2v-5H5v5H3m12-14c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-3V4h3m-1.5 1.5h-1.5v3h1.5c.28 0 .5-.22.5-.5v-2c0-.28-.22-.5-.5-.5M12 18V13h5v2h-3v3h3v2h-5Z" /></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '> ', asLine: true })} title="Blockquote">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z" /></svg>
        </MarkdownButton>
        <div className="divider"></div>
        <MarkdownButton onClick={() => applyMarkdown({ start: '- ', asLine: true })} title="Bulleted List">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"></path></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '1. ', asLine: true })} title="Numbered List">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg>
        </MarkdownButton>
        <MarkdownButton onClick={() => applyMarkdown({ start: '- [ ] ', asLine: true })} title="Checkbox">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8L10,17Z"></path></svg>
        </MarkdownButton>
        <div className="divider"></div>
         <MarkdownButton onClick={() => applyMarkdown({ start: '```\n', end: '\n```' })} title="Code Block">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z" /></svg>
        </MarkdownButton>
         <MarkdownButton onClick={() => applyMarkdown({ start: '\n---\n', insert: true })} title="Horizontal Rule">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4,11V13H20V11H4Z" /></svg>
        </MarkdownButton>

        <div className="flex-grow"></div>
        <button onClick={() => setIsPreview(!isPreview)} className={`p-2 rounded-md text-sm font-semibold ${isPreview ? 'bg-emerald-500/20 text-emerald-300' : 'text-secondary hover:bg-subtle'}`}>
          {isPreview ? 'Write' : 'View'}
        </button>
      </div>
       <div className="flex-shrink-0 text-xs text-secondary text-right px-4 pb-2 border-b border-divider">
        <span>{wordCount} words</span>
        <span className="mx-2">•</span>
        <span>Last updated: {new Date(currentNote.updatedAt).toLocaleDateString()}</span>
      </div>
      <div className="flex-grow flex flex-col overflow-y-auto">
        {isPreview ? (
          <div className="w-full h-full cursor-text" onClick={() => setIsPreview(false)}>
             {typeof currentNote.content !== 'string' || currentNote.content.trim() === '' ? (
                <div className="p-6 text-secondary text-center">
                    <p>Click here to start writing...</p>
                    <p className="text-xs mt-2">Type '/' for commands</p>
                </div>
            ) : (
                <MarkdownPreview 
                    content={typeof currentNote.content === 'string' ? currentNote.content : ''} 
                    onCheckboxToggle={handleCheckboxToggle} 
                />
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={typeof currentNote.content === 'string' ? currentNote.content : ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing... Type '/' for commands."
            className="w-full h-full bg-transparent p-6 text-primary resize-none focus:outline-none flex-grow"
          />
        )}
      </div>
    </div>
  );
};

export default NoteDetailView;