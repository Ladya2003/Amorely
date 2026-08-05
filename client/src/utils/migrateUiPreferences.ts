import {
  clearLocalBannerDismissals,
  getLocalLocaleBannerDismissedAt,
  isLocalInstallBannerDismissed,
  isLocalLocaleBannerDismissed,
} from '../components/Feed/feedBannerStorage';
import {
  clearLocalChatRulesConsent,
  hasAcceptedChatRules,
  readLocalChatRulesConsent,
} from '../legal/chatRulesConsent';
import { updateUiPreferences } from '../services/uiPreferencesService';

export type MigratableUiUser = {
  _id: string;
  localeBannerDismissedAt?: string | null;
  installBannerDismissed?: boolean;
  chatRulesConsent?: {
    version: number;
    acceptedAt: string;
  } | null;
};

/**
 * Переносит старые браузерные флаги (баннеры / согласие с правилами чата) в аккаунт один раз.
 */
export async function migrateLocalUiPreferencesToAccount(
  user: MigratableUiUser
): Promise<Partial<MigratableUiUser> | null> {
  const patch: Parameters<typeof updateUiPreferences>[0] = {};
  let shouldClearBanners = false;
  let shouldClearChatRules = false;

  if (!user.localeBannerDismissedAt && isLocalLocaleBannerDismissed()) {
    const dismissedAt = getLocalLocaleBannerDismissedAt();
    patch.dismissLocaleBanner = true;
    if (dismissedAt) {
      patch.localeBannerDismissedAt = dismissedAt;
    }
    shouldClearBanners = true;
  }

  if (!user.installBannerDismissed && isLocalInstallBannerDismissed()) {
    patch.dismissInstallBanner = true;
    shouldClearBanners = true;
  }

  const localChatConsent = readLocalChatRulesConsent(user._id);
  if (localChatConsent && !hasAcceptedChatRules(user.chatRulesConsent)) {
    patch.acceptChatRules = true;
    shouldClearChatRules = true;
  }

  if (
    !patch.dismissLocaleBanner &&
    !patch.dismissInstallBanner &&
    !patch.acceptChatRules
  ) {
    return null;
  }

  try {
    const updated = await updateUiPreferences(patch);
    if (shouldClearBanners) {
      clearLocalBannerDismissals();
    }
    if (shouldClearChatRules) {
      clearLocalChatRulesConsent(user._id);
    }
    return {
      localeBannerDismissedAt: updated.localeBannerDismissedAt,
      installBannerDismissed: updated.installBannerDismissed,
      chatRulesConsent: updated.chatRulesConsent,
    };
  } catch (error) {
    console.error('Не удалось мигрировать UI-предпочтения в аккаунт:', error);
    return null;
  }
}
