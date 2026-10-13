const supabase = require('./supabase');

async function unwrap(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    dialCode: row.dial_code,
    name: row.name,
    email: row.email,
    occupation: row.occupation,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getUserById(userId) {
  const row = await unwrap(
    supabase.getClient().from('users').select('*').eq('id', userId).maybeSingle()
  );
  return toUser(row);
}

async function getUserByPhone(dialCode, phone) {
  const row = await unwrap(
    supabase.getClient().from('users')
      .select('*')
      .eq('dial_code', dialCode)
      .eq('phone', phone)
      .maybeSingle()
  );
  return toUser(row);
}

async function getOrCreateUserByPhone(dialCode, phone) {
  const existingUser = await getUserByPhone(dialCode, phone);
  if (existingUser) return { user: existingUser, created: false };

  try {
    const row = await unwrap(
      supabase.getClient().from('users')
        .insert({ dial_code: dialCode, phone })
        .select('*')
        .single()
    );
    return { user: toUser(row), created: true };
  } catch (error) {
    if (error.code !== '23505' && error.status !== 409) throw error;

    const user = await getUserByPhone(dialCode, phone);
    if (!user) throw error;
    return { user, created: false };
  }
}

async function updateUser(userId, fields) {
  const allowedColumns = {
    name: 'name',
    email: 'email',
    occupation: 'occupation',
    language: 'language',
  };
  const updates = { updated_at: new Date().toISOString() };
  for (const [field, value] of Object.entries(fields)) {
    const column = allowedColumns[field];
    if (column) updates[column] = value;
  }

  const row = await unwrap(
    supabase.getClient().from('users').update(updates).eq('id', userId).select('*').maybeSingle()
  );
  return toUser(row);
}

async function claimStrokePreview(userId) {
  const result = await unwrap(
    supabase.getClient().rpc('claim_stroke_preview', { p_user_id: userId }).single()
  );
  return {
    hasPrimeAccess: result.has_prime_access,
    previewClaimed: result.preview_claimed,
    previewCount: result.preview_count,
  };
}

async function archiveAndDeleteUser(userId) {
  const user = await unwrap(
    supabase.getClient().rpc('archive_and_delete_user', { p_user_id: userId })
  );
  return toUser(user);
}

module.exports = {
  getUserById,
  getUserByPhone,
  getOrCreateUserByPhone,
  updateUser,
  claimStrokePreview,
  archiveAndDeleteUser,
};