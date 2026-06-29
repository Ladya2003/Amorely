import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
import { ReactComponent as HomeIconSvg } from '../../assets/icons/home.svg';
import { ReactComponent as HomeFilledIconSvg } from '../../assets/icons/home-filled.svg';
import { ReactComponent as ChatIconSvg } from '../../assets/icons/chat.svg';
import { ReactComponent as ChatFilledIconSvg } from '../../assets/icons/chat-filled.svg';
import { ReactComponent as CalendarIconSvg } from '../../assets/icons/calendar.svg';
import { ReactComponent as CalendarFilledIconSvg } from '../../assets/icons/calendar-filled.svg';
import { ReactComponent as NewsIconSvg } from '../../assets/icons/news.svg';
import { ReactComponent as NewsFilledIconSvg } from '../../assets/icons/news-filled.svg';
import { ReactComponent as SettingsIconSvg } from '../../assets/icons/settings.svg';
import { ReactComponent as SettingsFilledIconSvg } from '../../assets/icons/settings-filled.svg';
import { ReactComponent as PaperClipIconSvg } from '../../assets/icons/paper-clip.svg';
import { ReactComponent as PinIconSvg } from '../../assets/icons/pin.svg';
import { ReactComponent as SendMessageIconSvg } from '../../assets/icons/send-message.svg';

const createAppIcon = (IconSvg: React.FunctionComponent<React.SVGProps<SVGSVGElement>>) =>
  function AppIcon(props: SvgIconProps) {
    return <SvgIcon component={IconSvg} inheritViewBox {...props} />;
  };

const createAppStrokeIcon = (IconSvg: React.FunctionComponent<React.SVGProps<SVGSVGElement>>) =>
  function AppStrokeIcon(props: SvgIconProps) {
    const { sx, ...rest } = props;

    return (
      <SvgIcon
        component={IconSvg}
        inheritViewBox
        {...rest}
        sx={[
          {
            fill: 'none',
            '& path': {
              fill: 'none',
              stroke: 'currentColor',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      />
    );
  };

export const AppHomeIcon = createAppIcon(HomeIconSvg);
export const AppHomeFilledIcon = createAppIcon(HomeFilledIconSvg);
export const AppChatIcon = createAppIcon(ChatIconSvg);
export const AppChatFilledIcon = createAppIcon(ChatFilledIconSvg);
export const AppCalendarIcon = createAppIcon(CalendarIconSvg);
export const AppCalendarFilledIcon = createAppIcon(CalendarFilledIconSvg);
export const AppNewsIcon = createAppIcon(NewsIconSvg);
export const AppNewsFilledIcon = createAppIcon(NewsFilledIconSvg);
export const AppSettingsIcon = createAppIcon(SettingsIconSvg);
export const AppSettingsFilledIcon = createAppIcon(SettingsFilledIconSvg);
export const AppPaperClipIcon = createAppStrokeIcon(PaperClipIconSvg);
export const AppPinIcon = createAppIcon(PinIconSvg);
export const AppSendMessageIcon = createAppIcon(SendMessageIconSvg);
