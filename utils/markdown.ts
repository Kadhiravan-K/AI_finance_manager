// A simple but effective markdown syntax highlighter for the live preview.
function escapeAttribute(s: string): string {
  return s.replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/&/g, '&amp;');
}

export const highlightMarkdown = (text: string): string => {
  if (!text) return '';
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code Blocks (must be first)
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
    const escapedCodeForDisplay = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="code-block-container"><button class="copy-code-btn" data-copy-content="${escapeAttribute(code)}">Copy</button><pre><code>${escapedCodeForDisplay}</code></pre></div>`;
  });
  
  // Callouts
  const calloutTypes: Record<string, string> = {
      NOTE: 'ℹ️',
      TIP: '💡',
      IMPORTANT: '❗',
      WARNING: '⚠️',
      CAUTION: '🔥',
  };
  html = html.replace(/^&gt;\s*\[!(\w+)\]\s*(.*)/gm, (match, type, content) => {
      const typeUpper = type.toUpperCase();
      const icon = calloutTypes[typeUpper] || 'ℹ️';
      return `<div class="callout ${type.toLowerCase()}"><span class="callout-icon">${icon}</span><div>${content}</div></div>`;
  });
  
  // Blockquote (that are not callouts)
  html = html.replace(/^&gt;\s(?!\[!\w+\])(.*)/gm, '<blockquote class="pl-4 border-l-4 border-divider text-secondary italic">$1</blockquote>');


  // Headings (at start of line)
  html = html.replace(/^###\s(.+)/gm, '<h3 class="text-lg font-semibold text-primary mb-1">$1</h3>');
  html = html.replace(/^##\s(.+)/gm, '<h2 class="text-xl font-bold text-primary mb-2">$1</h2>');
  html = html.replace(/^#\s(.+)/gm, '<h1 class="text-2xl font-extrabold text-primary mb-3">$1</h1>');
  
  // Bold, Italic, Strikethrough
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Lists (basic)
  html = html.replace(/^-\s/gm, '• ');
  html = html.replace(/^\d+\.\s/gm, '$&'); // Keep number for numbered list

  // HR
  html = html.replace(/^(---|\*\*\*)/gm, '<hr class="border-divider my-4" />');
  
  return html.replace(/\n/g, '<br />');
};