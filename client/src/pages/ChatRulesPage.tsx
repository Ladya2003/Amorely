import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Link, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CHAT_RULES_FULL_SECTIONS } from '../legal/chatRulesContent';

const ChatRulesPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 3, pb: 6 }}>
      <Button
        component={RouterLink}
        to="/chat"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
        color="inherit"
      >
        Назад к чату
      </Button>

      <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Правила использования чата Amorely
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Полная редакция. Краткое резюме показывается при первом входе во вкладку «Чат». Текст может быть
        обновлён после юридической проверки.
      </Typography>

      {CHAT_RULES_FULL_SECTIONS.map((section) => (
        <Box key={section.title} component="section" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
            {section.title}
          </Typography>
          {section.paragraphs.map((p, i) => (
            <Typography key={i} variant="body2" color="text.primary" sx={{ mb: 1.25, lineHeight: 1.65 }}>
              {p}
            </Typography>
          ))}
        </Box>
      ))}

      <Link component={RouterLink} to="/chat" sx={{ display: 'inline-block', mt: 2 }}>
        Вернуться к чату
      </Link>
    </Container>
  );
};

export default ChatRulesPage;
