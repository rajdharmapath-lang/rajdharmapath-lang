const { getPool } = require('./postgres');

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
  const { rows } = await getPool().query(
    'SELECT * FROM public.users WHERE id = $1 LIMIT 1',
    [userId]
  );
  return toUser(rows[0]);
}

async function getUserByPhone(dialCode, phone) {
  const { rows } = await getPool().query(
    'SELECT * FROM public.users WHERE dial_code = $1 AND phone = $2 LIMIT 1',
    [dialCode, phone]
  );
  return toUser(rows[0]);
}

async function getOrCreateUserByPhone(dialCode, phone) {
  const existingUser = await getUserByPhone(dialCode, phone);
  if (existingUser) return { user: existingUser, created: false };

  try {
    const { rows } = await getPool().query(
      'INSERT INTO public.users (dial_code, phone) VALUES ($1, $2) RETURNING *',
      [dialCode, phone]
    );
    return { user: toUser(rows[0]), created: true };
  } catch (error) {
    if (error.code !== '23505') throw error;

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
  const values = [userId];
  const assignments = [];
  for (const [field, value] of Object.entries(fields)) {
    const column = allowedColumns[field];
    if (!column) continue;
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  }
  assignments.push('updated_at = NOW()');

  const { rows } = await getPool().query(
    `UPDATE public.users SET ${assignments.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return toUser(rows[0]);
}

async function archiveAndDeleteUser(userId) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT * FROM public.users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    const user = rows[0];
    if (!user) {
      await client.query('COMMIT');
      return null;
    }

    await client.query(
      `INSERT INTO public.user_deletion_audit (
        original_user_id, dial_code, phone, name, email, occupation, language,
        created_at, updated_at, user_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        user.id,
        user.dial_code,
        user.phone,
        user.name,
        user.email,
        user.occupation,
        user.language,
        user.created_at,
        user.updated_at,
        JSON.stringify(user),
      ]
    );
    await client.query('DELETE FROM public.users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    return toUser(user);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getUserById,
  getUserByPhone,
  getOrCreateUserByPhone,
  updateUser,
  archiveAndDeleteUser,
};