import User from '../models/user';

/**
 * Existing accounts predate email verification — mark them verified (local).
 * Safe to run on every startup (idempotent filter).
 */
export async function migrateLegacyUsersEmailVerified(): Promise<void> {
  const result = await User.updateMany(
    {
      $or: [
        { emailVerified: { $exists: false } },
        { emailVerified: null },
        { authProvider: { $exists: false } },
        { authProvider: null },
      ],
    },
    {
      $set: {
        emailVerified: true,
        authProvider: 'local',
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`Migrated ${result.modifiedCount} legacy user(s) to emailVerified=true`);
  }
}
