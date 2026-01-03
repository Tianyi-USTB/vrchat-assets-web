import mysql from 'mysql2/promise';

export async function getDb(env) {
  const port = parseInt(env.DB_PORT) || 3306;

  console.log(`[DB] Connecting to ${env.DB_HOST}:${port}...`);

  const config = {
    // 必须使用之前验证成功的 IP 地址 (120.55.45.54)
    host: env.DB_HOST,
    port: port,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    
    // === 关键参数 ===
    // 禁用 eval，解决 Cloudflare 报错
    disableEval: true, 
    
    // 之前的经验：Cloudflare 上不传 ssl 参数或传 undefined 最稳
    // 如果 sqlpub 强制 ssl，可以改为 ssl: { rejectUnauthorized: false }
    ssl: undefined 
  };

  try {
    const connection = await mysql.createConnection(config);
    return connection;
  } catch (err) {
    console.error("============== 数据库连接失败 ==============");
    console.error("错误信息:", err.message);
    console.error("============================================");
    throw err;
  }
}