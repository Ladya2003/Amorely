export const ADMIN_NEW_USER_CUTOFF = new Date('2026-06-11T00:00:00.000Z');

export const getEffectiveIsNewForAdmin = (user: {
  createdAt: Date | string;
  isNewForAdmin?: boolean | null;
}): boolean => {
  if (user.isNewForAdmin === true) {
    return true;
  }
  if (user.isNewForAdmin === false) {
    return false;
  }
  return new Date(user.createdAt) >= ADMIN_NEW_USER_CUTOFF;
};
