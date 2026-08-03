import axios from 'axios';
import { API_URL } from '../config';

export interface CoupleDistanceStatus {
  myLocationShared: boolean;
  partnerLocationShared: boolean;
  distanceKm: number | null;
  myLocationUpdatedAt: string | null;
  partnerLocationUpdatedAt: string | null;
}

export const fetchCoupleDistanceStatus = async (): Promise<CoupleDistanceStatus> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authorized');
  }

  const response = await axios.get(`${API_URL}/api/relationships/location`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data as CoupleDistanceStatus;
};

export const shareCurrentLocation = async (lat: number, lng: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authorized');
  }

  await axios.post(
    `${API_URL}/api/relationships/location`,
    { lat, lng },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
