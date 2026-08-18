import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
import type { TablerIcon } from '@tabler/icons-react';
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowLeft,
  IconArrowUpRight,
  IconArrowsMaximize,
  IconBan,
  IconBell,
  IconBellRinging,
  IconBolt,
  IconBrandLine,
  IconBrush,
  IconBucketDroplet,
  IconBuildingStore,
  IconBulb,
  IconCake,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarSmile,
  IconCamera,
  IconCheck,
  IconChecks,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconCloudUpload,
  IconCopy,
  IconDeviceFloppy,
  IconDeviceGamepad2,
  IconDeviceMobileDown,
  IconDevices,
  IconDots,
  IconDotsVertical,
  IconDownload,
  IconEraser,
  IconEye,
  IconEyeOff,
  IconFilter,
  IconGift,
  IconGripVertical,
  IconHandClick,
  IconHeadset,
  IconHeart,
  IconHeartFilled,
  IconHelp,
  IconHistory,
  IconHome,
  IconInfinity,
  IconInfoCircle,
  IconLanguage,
  IconLayoutGrid,
  IconList,
  IconLock,
  IconLockOpen,
  IconLockQuestion,
  IconLogout,
  IconMapPin,
  IconMessageCircle,
  IconMoon,
  IconNews,
  IconNote,
  IconNotes,
  IconPalette,
  IconPaperclip,
  IconPaw,
  IconPencil,
  IconPhoto,
  IconPhotoPlus,
  IconPinned,
  IconPlayerPlay,
  IconPlayerPlayFilled,
  IconPlayerSkipForward,
  IconPlayerStop,
  IconPlus,
  IconRefresh,
  IconRepeat,
  IconSearch,
  IconSelector,
  IconSend,
  IconSettings,
  IconShieldLock,
  IconSparkles,
  IconSpeakerphone,
  IconSun,
  IconSunMoon,
  IconTag,
  IconTextDecrease,
  IconTextIncrease,
  IconToolsKitchen2,
  IconTrash,
  IconTrashX,
  IconTrophy,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconVideo,
  IconWorld,
  IconX,
} from '@tabler/icons-react';

type CreateOptions = {
  filled?: boolean;
};

export function createTablerIcon(TablerIcon: TablerIcon, options: CreateOptions = {}) {
  const AppIcon = React.forwardRef<SVGSVGElement, SvgIconProps>(function AppTablerIcon(props, ref) {
    const { sx, ...rest } = props;

    return (
      <SvgIcon
        ref={ref}
        component={TablerIcon}
        inheritViewBox
        {...rest}
        sx={[
          options.filled ? null : { fill: 'none' },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      />
    );
  });

  AppIcon.displayName = TablerIcon.displayName || 'AppTablerIcon';
  return AppIcon;
}

export type AppIconComponent = React.ComponentType<SvgIconProps>;

const iconX = createTablerIcon(IconX);
const iconPencil = createTablerIcon(IconPencil);
const iconTrash = createTablerIcon(IconTrash);
const iconCheck = createTablerIcon(IconCheck);
const iconCircleCheck = createTablerIcon(IconCircleCheck);
const iconChevronDown = createTablerIcon(IconChevronDown);
const iconChevronLeft = createTablerIcon(IconChevronLeft);
const iconChevronRight = createTablerIcon(IconChevronRight);
const iconChevronUp = createTablerIcon(IconChevronUp);
const iconHeart = createTablerIcon(IconHeart);
const iconHeartFilled = createTablerIcon(IconHeartFilled, { filled: true });
const iconMessageCircle = createTablerIcon(IconMessageCircle);
const iconPhoto = createTablerIcon(IconPhoto);
const iconCalendar = createTablerIcon(IconCalendar);
const iconCalendarEvent = createTablerIcon(IconCalendarEvent);
const iconSparkles = createTablerIcon(IconSparkles);
const iconBell = createTablerIcon(IconBell);
const iconLock = createTablerIcon(IconLock);
const iconList = createTablerIcon(IconList);
const iconCloudUpload = createTablerIcon(IconCloudUpload);
const iconAlertTriangle = createTablerIcon(IconAlertTriangle);
const iconPlayerPlay = createTablerIcon(IconPlayerPlay);
const iconTrophy = createTablerIcon(IconTrophy);
const iconGift = createTablerIcon(IconGift);
const iconKitchen = createTablerIcon(IconToolsKitchen2);
const iconGamepad = createTablerIcon(IconDeviceGamepad2);
const iconSearch = createTablerIcon(IconSearch);
const iconPlus = createTablerIcon(IconPlus);
const iconSend = createTablerIcon(IconSend);
const iconArrowLeft = createTablerIcon(IconArrowLeft);
const iconLayoutGrid = createTablerIcon(IconLayoutGrid);
const iconTrashX = createTablerIcon(IconTrashX);
const iconSpeakerphone = createTablerIcon(IconSpeakerphone);
const iconRefresh = createTablerIcon(IconRefresh);
const iconPalette = createTablerIcon(IconPalette);
const iconArrowBackUp = createTablerIcon(IconArrowBackUp);
const iconCake = createTablerIcon(IconCake);
const iconEye = createTablerIcon(IconEye);
const iconBan = createTablerIcon(IconBan);
const iconLockOpen = createTablerIcon(IconLockOpen);
const iconClock = createTablerIcon(IconClock);
const iconNotes = createTablerIcon(IconNotes);
const iconVideo = createTablerIcon(IconVideo);
const iconGripVertical = createTablerIcon(IconGripVertical);
const iconInfoCircle = createTablerIcon(IconInfoCircle);
const iconLanguage = createTablerIcon(IconLanguage);
const iconSettings = createTablerIcon(IconSettings);
const iconHome = createTablerIcon(IconHome);
const iconBrandLine = createTablerIcon(IconBrandLine);
const iconCalendarSmile = createTablerIcon(IconCalendarSmile);
const iconNews = createTablerIcon(IconNews);

export const CloseIcon = iconX;
export const ClearIcon = iconX;
export const CancelIcon = iconX;
export const EditIcon = iconPencil;
export const EditOutlinedIcon = iconPencil;
export const CreateIcon = iconPencil;
export const DeleteIcon = iconTrash;
export const DeleteOutlineIcon = iconTrash;
export const CheckIcon = iconCheck;
export const CheckRoundedIcon = iconCheck;
export const DoneIcon = iconCheck;
export const CheckCircleIcon = iconCircleCheck;
export const CheckCircleOutlineIcon = iconCircleCheck;
export const ExpandMoreIcon = iconChevronDown;
export const ExpandMoreRoundedIcon = iconChevronDown;
export const KeyboardArrowDownIcon = iconChevronDown;
export const ChevronLeftIcon = iconChevronLeft;
export const ArrowBackIosNewIcon = iconChevronLeft;
export const ChevronRightIcon = iconChevronRight;
export const ArrowForwardIosIcon = iconChevronRight;
export const ExpandLessIcon = iconChevronUp;
export const KeyboardArrowUpIcon = iconChevronUp;
export const FavoriteBorderIcon = iconHeart;
export const FavoriteBorderOutlinedIcon = iconHeart;
export const FavoriteIcon = iconHeartFilled;
export const FavoriteRoundedIcon = iconHeartFilled;
export const ChatIcon = iconMessageCircle;
export const ChatBubbleOutlineIcon = iconMessageCircle;
export const ImageIcon = iconPhoto;
export const PhotoIcon = iconPhoto;
export const PhotoLibraryOutlinedIcon = iconPhoto;
export const CalendarMonthIcon = iconCalendar;
export const CalendarTodayIcon = iconCalendar;
export const CalendarMonthOutlinedIcon = iconCalendar;
export const EventIcon = iconCalendarEvent;
export const AutoAwesomeIcon = iconSparkles;
export const NotificationsIcon = iconBell;
export const NotificationsNoneOutlinedIcon = iconBell;
export const LockIcon = iconLock;
export const LockOutlinedIcon = iconLock;
export const ViewListIcon = iconList;
export const ListAltIcon = iconList;
export const CloudUploadIcon = iconCloudUpload;
export const ReportOutlinedIcon = iconAlertTriangle;
export const WarningAmberIcon = iconAlertTriangle;
export const WarningAmberRoundedIcon = iconAlertTriangle;
export const PlayCircleOutlineIcon = iconPlayerPlay;
export const PlayArrowIcon = iconPlayerPlay;
export const EmojiEventsIcon = iconTrophy;
export const EmojiEventsOutlinedIcon = iconTrophy;
export const CardGiftcardIcon = iconGift;
export const CardGiftcardOutlinedIcon = iconGift;
export const RestaurantMenuIcon = iconKitchen;
export const SportsEsportsIcon = iconGamepad;
export const SearchIcon = iconSearch;
export const AddIcon = iconPlus;
export const SendIcon = iconSend;
export const ArrowBackIcon = iconArrowLeft;
export const GridViewIcon = iconLayoutGrid;
export const DeleteSweepIcon = iconTrashX;
export const AnnouncementIcon = iconSpeakerphone;
export const UpdateIcon = iconRefresh;
export const RestartAltIcon = iconRefresh;
export const PaletteIcon = iconPalette;
export const ReplyOutlinedIcon = iconArrowBackUp;
export const CakeIcon = iconCake;
export const CakeOutlinedIcon = iconCake;
export const VisibilityIcon = iconEye;
export const Visibility = iconEye;
export const BlockIcon = iconBan;
export const LockOpenIcon = iconLockOpen;
export const ScheduleIcon = iconClock;
export const AccessTimeIcon = iconClock;
export const DescriptionIcon = iconNotes;
export const VideocamIcon = iconVideo;
export const DragHandleIcon = iconGripVertical;
export const InfoOutlinedIcon = iconInfoCircle;
export const LanguageIcon = iconLanguage;
export const TranslateRoundedIcon = iconLanguage;
export const SettingsIcon = iconSettings;

export const DoneAllIcon = createTablerIcon(IconChecks);
export const MoreHorizIcon = createTablerIcon(IconDots);
export const MoreVertIcon = createTablerIcon(IconDotsVertical);
export const PersonIcon = createTablerIcon(IconUser);
export const PeopleIcon = createTablerIcon(IconUsers);
export const PersonAddIcon = createTablerIcon(IconUserPlus);
export const SecurityIcon = createTablerIcon(IconShieldLock);
export const PhotoCameraIcon = createTablerIcon(IconCamera);
export const VisibilityOff = createTablerIcon(IconEyeOff);
export const ForwardOutlinedIcon = createTablerIcon(IconArrowForwardUp);
export const TextDecreaseIcon = createTablerIcon(IconTextDecrease);
export const TextIncreaseIcon = createTablerIcon(IconTextIncrease);
export const FilterListIcon = createTablerIcon(IconFilter);
export const SupportAgentIcon = createTablerIcon(IconHeadset);
export const PanToolAltOutlinedIcon = createTablerIcon(IconHandClick);
export const DevicesOutlinedIcon = createTablerIcon(IconDevices);
export const LightbulbOutlinedIcon = createTablerIcon(IconBulb);
export const PetsOutlinedIcon = createTablerIcon(IconPaw);
export const QuizOutlinedIcon = createTablerIcon(IconHelp);
export const PublicOutlinedIcon = createTablerIcon(IconWorld);
export const BrushOutlinedIcon = createTablerIcon(IconBrush);
export const BrushIcon = createTablerIcon(IconBrush);
export const InstallMobileIcon = createTablerIcon(IconDeviceMobileDown);
export const HistoryOutlinedIcon = createTablerIcon(IconHistory);
export const MapPinIcon = createTablerIcon(IconMapPin);
export const ContentCopyIcon = createTablerIcon(IconCopy);
export const LockResetIcon = createTablerIcon(IconLockQuestion);
export const NorthEastIcon = createTablerIcon(IconArrowUpRight);
export const PlayCircleFilledIcon = createTablerIcon(IconPlayerPlayFilled, { filled: true });
export const StickyNote2Icon = createTablerIcon(IconNote);
export const DownloadIcon = createTablerIcon(IconDownload);
export const NewReleasesIcon = createTablerIcon(IconSparkles);
export const LogoutIcon = createTablerIcon(IconLogout);
export const UnfoldMoreIcon = createTablerIcon(IconSelector);
export const LightModeIcon = createTablerIcon(IconSun);
export const DarkModeIcon = createTablerIcon(IconMoon);
export const SettingsBrightnessIcon = createTablerIcon(IconSunMoon);
export const OpenInFullIcon = createTablerIcon(IconArrowsMaximize);
export const SaveIcon = createTablerIcon(IconDeviceFloppy);
export const StopCircleIcon = createTablerIcon(IconPlayerStop);
export const LabelOutlinedIcon = createTablerIcon(IconTag);
export const UndoIcon = createTablerIcon(IconArrowBackUp);
export const RedoIcon = createTablerIcon(IconArrowForwardUp);
export const AutoFixHighIcon = createTablerIcon(IconEraser);
export const FormatColorFillIcon = createTablerIcon(IconBucketDroplet);
export const ReplayIcon = createTablerIcon(IconRepeat);
export const StorefrontIcon = createTablerIcon(IconBuildingStore);
export const SkipNextIcon = createTablerIcon(IconPlayerSkipForward);
export const AllInclusiveIcon = createTablerIcon(IconInfinity);
export const AddPhotoAlternateIcon = createTablerIcon(IconPhotoPlus);
export const NotificationsActiveOutlinedIcon = createTablerIcon(IconBellRinging);
export const BoltIcon = createTablerIcon(IconBolt);

export const AppHomeIcon = iconHome;
export const AppHomeFilledIcon = iconHome;
export const AppChatIcon = iconBrandLine;
export const AppChatFilledIcon = iconBrandLine;
export const AppCalendarIcon = iconCalendarSmile;
export const AppCalendarFilledIcon = iconCalendarSmile;
export const AppNewsIcon = iconNews;
export const AppNewsFilledIcon = iconNews;
export const AppSettingsIcon = iconSettings;
export const AppSettingsFilledIcon = iconSettings;
export const AppPaperClipIcon = createTablerIcon(IconPaperclip);
export const AppPinIcon = createTablerIcon(IconPinned);
export const AppSendMessageIcon = iconSend;
