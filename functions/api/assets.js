import { getDb } from '../utils/db.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  // 获取参数
  const q = url.searchParams.get('q');
  const type = url.searchParams.get('type'); 
  const char = url.searchParams.get('char'); // 新增：角色筛选参数
  const id = url.searchParams.get('id');

  let conn = null;

  try {
    conn = await getDb(env);
    let results;

    // 1. 详情查询 (不变)
    if (id) {
        const [assets] = await conn.execute('SELECT * FROM Assets WHERE boothId = ?', [id]);
        if (assets.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
        const [links] = await conn.execute('SELECT * FROM DownloadLinks WHERE boothId = ?', [id]);
        return Response.json({ asset: assets[0], links });
    }

    // 2. 列表查询
    let sql = "SELECT * FROM Assets WHERE 1=1";
    let params = [];

    // (A) 关键词搜索
    if (q) {
        sql += " AND (assetName LIKE ? OR assetChineseName LIKE ? OR boothId = ?)";
        params.push(`%${q}%`, `%${q}%`, q);
    }

    // (B) 类型筛选
    if (type && type !== 'all') {
        sql += " AND assetType = ?";
        params.push(type);
    }

    // (C) 角色筛选 (关键新增)
    // 逻辑：如果选了角色(例如 Eku)，我们要找出 adaptAvatars 包含 "Eku" 或者 包含 "all" 的资源
    if (char) {
        // 使用 LIKE 进行模糊匹配，兼容性最好。
        // 注意：数据库存的是 ["eku", "milltina"]，所以我们搜 %"eku"%
        // 我们在 SQL 里都转成小写比较，忽略大小写差异
        sql += " AND (LOWER(adaptAvatars) LIKE ? OR LOWER(adaptAvatars) LIKE ?)";
        const searchChar = `%"${char.toLowerCase()}"%`; // 匹配目标角色
        const searchAll = `%"all"%`;                  // 匹配通用资源
        params.push(searchChar, searchAll);
    }

    // 排序和分页
    sql += " ORDER BY boothId DESC LIMIT 50";

    const [rows] = await conn.execute(sql, params);
    results = rows;

    return Response.json(results);

  } catch (err) {
    console.error("API Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  } finally {
    if (conn) conn.end();
  }
}