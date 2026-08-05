import axios from 'axios';
import { API_URL } from '../config';

export type ChatRulesConsent = {
  version: number;
  acceptedAt: string;
};

export type UiPreferencesResponse = {
  message: string;
  localeBannerDismissedAt: string | null;
  installBannerDismissed: boolean;
  chatRulesConsent: ChatRulesConsent | null;
};

export type UiPreferencesPatch = {
  dismissLocaleBanner?: boolean;
  dismissInstallBanner?: boolean;
  acceptChatRules?: boolean;
  localeBannerDismissedAt?: string | number;
};

export const updateUiPreferences = async (
  patch: UiPreferencesPatch
): Promise<UiPreferencesResponse> => {
  const response = await axios.put<UiPreferencesResponse>(
    `${API_URL}/api/settings/ui-preferences`,
    patch
  );
  return response.data;
};
