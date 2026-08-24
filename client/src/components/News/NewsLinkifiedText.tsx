import React from 'react';
import { Box } from '@mui/material';

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)]+$/;

interface NewsLinkifiedTextProps {
  text: string;
}

const NewsLinkifiedText: React.FC<NewsLinkifiedTextProps> = ({ text }) => {
  const nodes: React.ReactNode[] = [];
  const regex = new RegExp(URL_PATTERN.source, 'g');
  let lastIndex = 0;
  let key = 0;
  let match = regex.exec(text);

  while (match) {
    const raw = match[0];
    const trailing = raw.match(TRAILING_PUNCTUATION)?.[0] ?? '';
    const href = trailing ? raw.slice(0, -trailing.length) : raw;

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (href) {
      nodes.push(
        <Box
          component="a"
          key={`news-link-${key}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          sx={{ color: 'primary.main', wordBreak: 'break-word' }}
        >
          {href}
        </Box>
      );
      key += 1;
    }

    if (trailing) {
      nodes.push(trailing);
    }

    lastIndex = match.index + raw.length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
};

export default NewsLinkifiedText;
