import { getDb } from '../../utils/db.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const token = request.headers.get('Authorization');
  if (token !== env.ADMIN_TOKEN) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { boothId } = await request.json();
  let conn = null;

  try {
    conn = await getDb(env);
    
    // === 关键修改 ===
    // WHERE assetId -> WHERE boothId
    // 你的数据库里 Assets 表和 DownloadLinks 表都是用 boothId 关联的
    await conn.execute('DELETE FROM DownloadLinks WHERE boothId = ?', [boothId]);
    await conn.execute('DELETE FROM Assets WHERE boothId = ?', [boothId]);
    
    return Response.json({ success: true });
  } catch (err) {
    console.error("Delete Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  } finally {
    if (conn) conn.end();
  }
}