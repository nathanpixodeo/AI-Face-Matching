import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/user.model';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error('Usage: npm run grant-superadmin -- user@example.com');
  }

  await connectDatabase();
  try {
    const user = await User.findOneAndUpdate({ email }, { isSuperadmin: true }, { new: true })
      .select('email firstName lastName');
    if (!user) {
      throw new Error(`No user found for ${email}`);
    }
    console.log(`Superadmin granted to ${user.email}`);
  } finally {
    await disconnectDatabase();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
