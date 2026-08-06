import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RevealOnScroll from './RevealOnScroll';
import {
  getAuthLandingFaqAccordionSx,
  getAuthLandingFaqAnswerSx,
  getAuthLandingFaqQuestionSx,
  getAuthLandingFaqSummarySx,
  getAuthLandingFaqSx,
  getAuthLandingFaqTitleSx,
} from './authPageStyles';

const FAQ_IDS = ['free', 'private', 'partner', 'distance', 'features', 'devices'] as const;

const AuthLandingFaq: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | false>(false);

  const faqItems = useMemo(
    () =>
      FAQ_IDS.map((id) => ({
        id,
        question: t(`auth.landing.faq.items.${id}.question`),
        answer: t(`auth.landing.faq.items.${id}.answer`),
      })),
    [t, i18n.language]
  );

  return (
    <Box
      component="section"
      aria-label={t('auth.landing.faq.ariaLabel')}
      sx={getAuthLandingFaqSx()}
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <RevealOnScroll>
        <Typography component="h2" sx={getAuthLandingFaqTitleSx()}>
          {t('auth.landing.faq.title')}
        </Typography>
      </RevealOnScroll>

      <Box>
        {faqItems.map((item, index) => (
          <RevealOnScroll key={item.id} delayMs={(index % 3) * 40}>
            <Accordion
              disableGutters
              expanded={expanded === item.id}
              onChange={(_, isExpanded) => setExpanded(isExpanded ? item.id : false)}
              sx={getAuthLandingFaqAccordionSx(theme)}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={getAuthLandingFaqSummarySx()}
                aria-controls={`landing-faq-${item.id}-content`}
                id={`landing-faq-${item.id}-header`}
              >
                <Typography component="h3" itemProp="name" sx={getAuthLandingFaqQuestionSx()}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Box itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <Typography itemProp="text" sx={getAuthLandingFaqAnswerSx()}>
                    {item.answer}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </RevealOnScroll>
        ))}
      </Box>
    </Box>
  );
};

export default AuthLandingFaq;
