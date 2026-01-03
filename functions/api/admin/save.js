import { getDb } from '../../utils/db.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const token = request.headers.get('Authorization');
  if (token !== env.ADMIN_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  let conn = null;

  try {
    conn = await getDb(env);
    await conn.beginTransaction();

    const assetType = data.assetType || 0;
    
    // === 关键修改：增加 assetChineseName 和 adaptAvatars ===
    const assetSql = `
      INSERT INTO Assets (boothId, assetName, previewImage, assetType, assetChineseName, adaptAvatars)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        assetName = VALUES(assetName), 
        previewImage = VALUES(previewImage),
        assetType = VALUES(assetType),
        assetChineseName = VALUES(assetChineseName),
        adaptAvatars = VALUES(adaptAvatars)
    `;
    
    // 注意参数顺序要对应 SQL 里的 ?
    await conn.execute(assetSql, [
        data.boothId, 
        data.assetName, 
        data.previewImage, 
        assetType,
        data.assetChineseName || null,  // 允许为空
        data.adaptAvatars || null       // 允许为空
    ]);

    // 删除旧链接
    await conn.execute('DELETE FROM DownloadLinks WHERE boothId = ?', [data.boothId]);

    // 插入新链接
    if (data.links && data.links.length > 0) {
        const linkSql = `INSERT INTO DownloadLinks (boothId, title, downloadLink, imageUrl, description) VALUES (?, ?, ?, ?, ?)`;
        for (const link of data.links) {
            await conn.execute(linkSql, [
                data.boothId, 
                link.title, 
                link.downloadLink, 
                link.imageUrl || null, 
                link.description || null
            ]);
        }
    }

    await conn.commit();
    return Response.json({ success: true });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Save Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  } finally {
    if (conn) conn.end();
  }
}