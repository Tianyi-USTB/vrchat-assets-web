import { Router } from 'itty-router';
import { getDb } from '../functions/utils/db.js'; // 复用之前的数据库逻辑

// 创建路由
const router = Router();

// === CORS设置 (允许跨域) ===
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// === 1. 公共 API: 获取资源列表/详情 ===
router.get('/api/assets', async (request, env) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const type = url.searchParams.get('type');
  const char = url.searchParams.get('char');
  const id = url.searchParams.get('id');

  let conn = null;
  try {
    conn = await getDb(env);

    // (A) 详情查询
    if (id) {
      const [assets] = await conn.execute('SELECT * FROM Assets WHERE boothId = ?', [id]);
      if (assets.length === 0) return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
      
      const [links] = await conn.execute('SELECT * FROM DownloadLinks WHERE boothId = ?', [id]);
      return Response.json({ asset: assets[0], links }, { headers: corsHeaders });
    }

    // (B) 列表查询
    let sql = "SELECT * FROM Assets WHERE 1=1";
    let params = [];

    if (q) {
      sql += " AND (assetName LIKE ? OR assetChineseName LIKE ? OR boothId = ?)";
      params.push(`%${q}%`, `%${q}%`, q);
    }
    if (type && type !== 'all') {
      sql += " AND assetType = ?";
      params.push(type);
    }
    if (char) {
      sql += " AND (LOWER(adaptAvatars) LIKE ? OR LOWER(adaptAvatars) LIKE ?)";
      params.push(`%"${char.toLowerCase()}"%`, `%"all"%`);
    }

    sql += " ORDER BY boothId DESC LIMIT 50";
    const [rows] = await conn.execute(sql, params);
    
    return Response.json(rows, { headers: corsHeaders });

  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  } finally {
    if (conn) conn.end();
  }
});

// === 2. 管理员 API: 保存 ===
router.post('/api/admin/save', async (request, env) => {
  const token = request.headers.get('Authorization');
  if (token !== env.ADMIN_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const data = await request.json();
  let conn = null;
  try {
    conn = await getDb(env);
    await conn.beginTransaction();

    const assetType = data.assetType || 0;
    const assetSql = `
      INSERT INTO Assets (boothId, assetName, previewImage, assetType, assetChineseName, adaptAvatars)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        assetName = VALUES(assetName), previewImage = VALUES(previewImage),
        assetType = VALUES(assetType), assetChineseName = VALUES(assetChineseName),
        adaptAvatars = VALUES(adaptAvatars)
    `;
    await conn.execute(assetSql, [
      data.boothId, data.assetName, data.previewImage, 
      assetType, data.assetChineseName, data.adaptAvatars
    ]);

    await conn.execute('DELETE FROM DownloadLinks WHERE boothId = ?', [data.boothId]);

    if (data.links && data.links.length > 0) {
      const linkSql = `INSERT INTO DownloadLinks (boothId, title, downloadLink, imageUrl, description) VALUES (?, ?, ?, ?, ?)`;
      for (const link of data.links) {
        await conn.execute(linkSql, [
          data.boothId, link.title, link.downloadLink, 
          link.imageUrl || null, link.description || null
        ]);
      }
    }

    await conn.commit();
    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    if (conn) await conn.rollback();
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  } finally {
    if (conn) conn.end();
  }
});

// === 3. 管理员 API: 删除 ===
router.post('/api/admin/delete', async (request, env) => {
  const token = request.headers.get('Authorization');
  if (token !== env.ADMIN_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }
  const { boothId } = await request.json();
  let conn = null;
  try {
    conn = await getDb(env);
    await conn.execute('DELETE FROM DownloadLinks WHERE boothId = ?', [boothId]);
    await conn.execute('DELETE FROM Assets WHERE boothId = ?', [boothId]);
    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  } finally {
    if (conn) conn.end();
  }
});

// === 处理 Preflight 请求 (CORS) ===
router.options('*', () => new Response(null, { headers: corsHeaders }));

// === 4. 静态资源托管 (Vue 前端) ===
// 如果不是 API 请求，剩下的都视为前端页面请求
router.all('*', async (request, env) => {
  // 尝试从 ASSETS 获取静态文件 (css, js, images)
  const url = new URL(request.url);
  let response = await env.ASSETS.fetch(request);
  
  if (response.status === 404 && !url.pathname.startsWith('/api/')) {
    // 如果是 SPA 路由（如 /123456），返回 index.html
    return await env.ASSETS.fetch(new URL('/', request.url));
  }
  
  return response;
});

// === Worker 入口 ===
export default {
  fetch: router.handle
};