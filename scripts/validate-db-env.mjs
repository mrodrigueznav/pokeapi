#!/usr/bin/env node
/**
 * Validates DATABASE_URL / DIRECT_DATABASE_URL before running Prisma migrations.
 * Supabase migrations require a direct/session connection on port 5432, not the transaction pooler (:6543).
 */

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_DATABASE_URL;

const errors = [];
const warnings = [];

function parseUrlSafe(value, name) {
  try {
    return new URL(value);
  } catch {
    errors.push(`${name} is not a valid URL. Special characters in the password must be URL-encoded (e.g. @ → %40).`);
    return null;
  }
}

function hasUnencodedPasswordChars(value) {
  // user:pass@host — if password contains @, there will be more than one @ before the host
  const withoutProtocol = value.replace(/^postgresql:\/\//, '');
  const atCount = (withoutProtocol.match(/@/g) ?? []).length;
  return atCount > 1;
}

if (!databaseUrl) {
  errors.push('DATABASE_URL is missing.');
}

if (!directUrl) {
  errors.push('DIRECT_DATABASE_URL is missing (required for prisma migrate deploy on Supabase).');
}

if (databaseUrl && hasUnencodedPasswordChars(databaseUrl)) {
  errors.push(
    'DATABASE_URL password appears to contain unencoded special characters (e.g. @). Encode them: @ → %40, # → %23.'
  );
}

if (directUrl && hasUnencodedPasswordChars(directUrl)) {
  errors.push(
    'DIRECT_DATABASE_URL password appears to contain unencoded special characters (e.g. @). Encode them: @ → %40.'
  );
}

const direct = directUrl ? parseUrlSafe(directUrl, 'DIRECT_DATABASE_URL') : null;

if (direct) {
  if (direct.port === '6543' || direct.searchParams.get('pgbouncer') === 'true') {
    errors.push(
      'DIRECT_DATABASE_URL must NOT use the transaction pooler (port 6543 / pgbouncer=true). Use port 5432 (Session mode / direct) from Supabase → Database → Connection string.'
    );
  }

  if (direct.port && direct.port !== '5432') {
    warnings.push(`DIRECT_DATABASE_URL uses port ${direct.port}; Supabase direct/session is usually 5432.`);
  }

  if (directUrl === databaseUrl) {
    errors.push('DIRECT_DATABASE_URL must differ from DATABASE_URL on Supabase (direct :5432 vs pooler :6543).');
  }
}

if (warnings.length > 0) {
  console.warn('\n⚠️  Database env warnings:');
  for (const w of warnings) console.warn(`   - ${w}`);
}

if (errors.length > 0) {
  console.error('\n❌ Database env validation failed:\n');
  for (const e of errors) console.error(`   - ${e}`);
  console.error(`
Supabase example:

  DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
  DIRECT_DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"

If your password contains @, encode it as %40 in both URLs.
`);
  process.exit(1);
}

console.log('✓ Database env looks valid for migrations (DIRECT_DATABASE_URL → port 5432).');
