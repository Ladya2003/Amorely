import React from 'react';
import { Box, Typography, IconButton, Badge, Tabs, Tab } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate } from 'react-router-dom';

interface FeedHeaderProps {
  daysCount: number | null;
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const FeedHeader: React.FC<FeedHeaderProps> = ({ daysCount, tabValue, onTabChange }) => {
  const navigate = useNavigate();

  const handleDaysClick = () => {
    // Плавная прокрутка к компоненту с количеством дней
    const daysElement = document.getElementById('days-together');
    if (daysElement) {
      daysElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHelpClick = () => {
    // Переход на страницу настроек для добавления партнера
    navigate('/settings');
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Лента
        </Typography>
        
        {daysCount !== null ? (
          <IconButton 
            color="primary" 
            onClick={handleDaysClick}
            sx={{ 
              bgcolor: 'rgba(255, 75, 141, 0.1)', 
              '&:hover': { bgcolor: 'rgba(255, 75, 141, 0.2)' } 
            }}
          >
            <Badge 
              badgeContent={daysCount} 
              color="primary"
              max={999}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.8rem',
                  height: '1.5rem',
                  minWidth: '1.5rem',
                  padding: '0 6px'
                }
              }}
            >
              <FavoriteIcon />
            </Badge>
          </IconButton>
        ) : (
          <IconButton 
            color="primary" 
            onClick={handleHelpClick}
            sx={{ 
              bgcolor: 'rgba(255, 75, 141, 0.1)', 
              '&:hover': { bgcolor: 'rgba(255, 75, 141, 0.2)' } 
            }}
          >
            <HelpOutlineIcon />
          </IconButton>
        )}
      </Box>
      
      {/* <Tabs 
        value={tabValue} 
        onChange={onTabChange} 
        variant="fullWidth"
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': {
            fontWeight: 'bold',
          },
          '& .Mui-selected': {
            color: 'primary.main',
          }
        }}
      >
        <Tab label="Партнер" />
        <Tab label="Свои" />
      </Tabs> */}
    </Box>
  );
};

export default FeedHeader; 