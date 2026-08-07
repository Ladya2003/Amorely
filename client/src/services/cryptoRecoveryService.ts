import axios from 'axios';
import { API_URL } from '../config';

export type CryptoRecoveryYesNoUnsure = 'yes' | 'no' | 'unsure';
export type CryptoRecoveryRememberOption = 'yes' | 'partial' | 'no';
export type CryptoRecoveryContext = 'calendar' | 'feed' | 'chat' | 'plans' | 'other';

export interface CreateCryptoRecoveryRequestPayload {
  multiplePassphrases: CryptoRecoveryYesNoUnsure;
  hasOldDeviceAccess: CryptoRecoveryYesNoUnsure;
  rememberOldPassphrase: CryptoRecoveryRememberOption;
  context?: CryptoRecoveryContext;
  description?: string;
  currentDeviceId?: string;
}

export const createCryptoRecoveryRequest = async (payload: CreateCryptoRecoveryRequestPayload) => {
  const response = await axios.post<{ id: string; status: string; createdAt: string }>(
    `${API_URL}/api/crypto/recovery-requests`,
    payload
  );
  return response.data;
};
