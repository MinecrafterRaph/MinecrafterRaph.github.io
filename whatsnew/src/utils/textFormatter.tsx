import React from 'react';

/**
 * Parses WhatsApp formatting syntax:
 * *bold* -> <strong>
 * _italic_ -> <em>
 * ~strike~ -> <del>
 * ```code``` -> <code>
 * URLs -> clickable <a>
 */
export function formatWhatsAppText(text: string): React.ReactNode {
  if (!text) return text;

  // Split by URLs first
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#027eb5] hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    return <FormattedInlineText key={index} text={part} />;
  });
}

const FormattedInlineText: React.FC<{ text: string }> = ({ text }) => {
  // WhatsApp tokens: ```code```, *bold*, _italic_, ~strike~
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Regex pattern for formatting tokens
  const formatRegex = /(```[\s\S]*?```|\*[^\s*][^*]*?\*|_[^\s_][^_]*?_|~[^\s~][^~]*?~)/;

  while (remaining.length > 0) {
    const match = remaining.match(formatRegex);
    if (!match || match.index === undefined) {
      tokens.push(remaining);
      break;
    }

    if (match.index > 0) {
      tokens.push(remaining.substring(0, match.index));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('```') && matchedStr.endsWith('```')) {
      const codeContent = matchedStr.slice(3, -3);
      tokens.push(
        <code
          key={key++}
          className="bg-black/8 px-1.5 py-0.5 rounded font-mono text-[12px] text-[#111b21] inline-block my-0.5"
        >
          {codeContent}
        </code>
      );
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      const content = matchedStr.slice(1, -1);
      tokens.push(
        <strong key={key++} className="font-semibold text-[#111b21]">
          {content}
        </strong>
      );
    } else if (matchedStr.startsWith('_') && matchedStr.endsWith('_')) {
      const content = matchedStr.slice(1, -1);
      tokens.push(
        <em key={key++} className="italic">
          {content}
        </em>
      );
    } else if (matchedStr.startsWith('~') && matchedStr.endsWith('~')) {
      const content = matchedStr.slice(1, -1);
      tokens.push(
        <del key={key++} className="line-through opacity-80">
          {content}
        </del>
      );
    }

    remaining = remaining.substring(match.index + matchedStr.length);
  }

  return <>{tokens}</>;
}
