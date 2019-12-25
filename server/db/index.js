import { Pool } from 'pg';
import configs from "../helpers/configs";
import migrate from './migration';

export let rawPool;

export const pool = migrate(rawPool = new Pool(configs.db));

export const query = async (text, args) => await ((await pool).query(text, args));

export async function connect(body) {
  const client = await ((await pool).connect());
  
  try {
    await client.query('BEGIN');
    const ret = await body(client);
    await client.query('COMMIT');
    return ret;
  } catch(e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

