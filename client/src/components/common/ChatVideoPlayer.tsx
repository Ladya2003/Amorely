import React, { useState } from 'react';
import { Typography } from '@mui/material';

interface ChatVideoPlayerProps {
  src: string | null;
  autoPlay?: boolean;
  style?: React.CSSProperties;
}

const ChatVideoPlayer: React.FC<ChatVideoPlayerProps> = ({ src, autoPlay = false, style }) => {
  const [failed, setFailed] = useState(false);

  if (!src) {
    return null;
  }

  if (failed) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Не удалось воспроизвести видео
      </Typography>
    );
  }

  return (
    <video
      src={src}
      controls
      playsInline
      autoPlay={autoPlay}
      preload="none"
      onError={() => setFailed(true)}
      style={{
        maxWidth: '100%',
        maxHeight: '200px',
        display: 'block',
        backgroundColor: '#000',
        ...style
      }}
    />
  );
};

export default ChatVideoPlayer;
