import bcrypt from 'bcryptjs';

const COST = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// Compared against when the email does not exist, so both failure paths take the same time.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-not-a-password', COST);
export const fakeVerify = (plain: string) => bcrypt.compare(plain, DUMMY_HASH).then(() => false);
