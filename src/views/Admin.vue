<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { Plus, Delete, Edit } from '@element-plus/icons-vue';

// 简单的认证 (实际项目应存在 Cookie/LocalStorage)
const token = ref(localStorage.getItem('admin_token') || '');
const isAuth = ref(false);

const checkAuth = () => {
  if (token.value) {
    localStorage.setItem('admin_token', token.value);
    isAuth.value = true;
    fetchList();
  }
};

// 数据列表
const tableData = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增资源');

// 表单数据
const formRef = ref();
const form = reactive({
  boothId: '',
  assetName: '',
  assetChineseName: '', // 新增
  assetType: 0,         // 新增
  previewImage: '',
  adaptAvatarsRaw: '',  // 用来绑定输入框
  links: []
})

// 获取列表
const fetchList = async () => {
  if (!isAuth.value) return;
  loading.value = true;
  try {
    const res = await axios.get('/api/assets?q='); // 获取全部
    tableData.value = res.data;
  } finally {
    loading.value = false;
  }
};

// 打开新增
const handleAdd = () => {
  dialogTitle.value = '新增资源';
  Object.assign(form, { boothId: '', assetName: '', previewImage: '', links: [] });
  // 默认给一个空链接方便输入
  addLinkItem();
  dialogVisible.value = true;
};

// 打开编辑 (需要先查详情以获取 Links)
const handleEdit = async (row) => {
  loading.value = true;
  try {
    const res = await axios.get(`/api/assets?id=${row.boothId}`);
    const data = res.data;
    dialogTitle.value = '编辑资源';
    Object.assign(form, {
      boothId: data.asset.boothId,
      assetName: data.asset.assetName,
      previewImage: data.asset.previewImage,
      links: data.links
    });
    dialogVisible.value = true;
  } catch(e) {
    ElMessage.error('获取详情失败');
  } finally {
    loading.value = false;
  }
};

const openDialog = async (row) => {
  if (row) {
     // ... 获取数据 ...
     const res = await axios.get(`/api/assets?id=${row.boothId}`)
     const data = res.data
     // ... 赋值 ...
     form.assetType = data.asset.assetType
     form.assetChineseName = data.asset.assetChineseName
     
     // 处理 JSON 转字符串显示
     let adapts = data.asset.adaptAvatars
     if (typeof adapts === 'string') adapts = JSON.parse(adapts)
     form.adaptAvatarsRaw = Array.isArray(adapts) ? adapts.join(', ') : ''
  } else {
     // ... 重置 ...
     form.assetType = 0
     form.adaptAvatarsRaw = ''
  }
  dialogVisible.value = true
}

// 提交保存
const submitForm = async () => {
  try {
    await axios.post('/api/admin/save', form, {
      headers: { 'Authorization': token.value }
    });
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    fetchList();
  } catch (e) {
    ElMessage.error('保存失败: ' + (e.response?.data?.error || e.message));
  }
};

const handleSubmit = async () => {
  try {
    // 1. 处理 "适配模型"：将逗号分隔的字符串转为数组
    const adaptArray = form.adaptAvatarsRaw 
        ? form.adaptAvatarsRaw.split(/[,，]/).map(s => s.trim()).filter(s => s) 
        : []
    
    // 2. 构造提交给后端的数据
    // 注意：我们将数组再次转为 JSON 字符串，方便数据库直接存储
    const postData = {
        boothId: form.boothId,
        assetName: form.assetName,
        assetChineseName: form.assetChineseName,
        assetType: form.assetType,
        previewImage: form.previewImage,
        adaptAvatars: JSON.stringify(adaptArray), // 转 JSON 字符串
        links: form.links
    }
    
    // 3. 发送请求 (这里修复了之前的语法错误)
    await axios.post('/api/admin/save', postData, {
      headers: { Authorization: token.value }
    })

    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData() // 重新加载列表
  } catch (e) {
    console.error(e)
    ElMessage.error(e.response?.data?.error || '保存失败')
  }
}

// 删除资源
const handleDelete = async (row) => {
  // 不需要 ElMessageBox 了，直接发请求
  try {
    await axios.post('/api/admin/delete', { boothId: row.boothId }, {
      headers: { Authorization: token.value }
    })
    ElMessage.success('已删除')
    loadData()
  } catch (e) {
    console.error(e)
    ElMessage.error('删除失败')
  }
}

// 动态链接表单操作
const addLinkItem = () => {
  form.links.push({ title: '', downloadLink: '', imageUrl: '', description: '' });
};
const removeLinkItem = (index) => {
  form.links.splice(index, 1);
};

// 页面加载
onMounted(() => {
    if(token.value) checkAuth();
});
</script>

<template>
  <div class="admin-container">
    <!-- 登录层 -->
    <div v-if="!isAuth" class="login-box">
      <h2>管理员登录</h2>
      <el-input v-model="token" type="password" placeholder="请输入 Admin Token" show-password @keyup.enter="checkAuth" />
      <el-button type="primary" @click="checkAuth" style="width: 100%; margin-top: 10px;">进入</el-button>
    </div>

    <!-- 管理层 -->
    <div v-else>
      <div class="toolbar">
        <h2>资源管理后台</h2>
        <div>
           <el-button @click="$router.push('/')">返回前台</el-button>
           <el-button type="primary" :icon="Plus" @click="handleAdd">新增资源</el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" border style="width: 100%">
        <el-table-column prop="boothId" label="ID" width="120" />
        <el-table-column label="预览图" width="100">
          <template #default="scope">
            <el-image :src="scope.row.previewImage" style="width: 50px; height: 50px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="assetName" label="名称" />
<el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            
            <!-- 修改开始：使用气泡确认框代替原来的普通按钮 -->
            <el-popconfirm 
                title="确定要删除这个资源吗？" 
                confirm-button-text="确定"
                cancel-button-text="取消"
                width="200"
                @confirm="handleDelete(row)"
            >
                <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                </template>
            </el-popconfirm>
            <!-- 修改结束 -->

          </template>
        </el-table-column>
      </el-table>

      <!-- 编辑/新增对话框 -->
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
        <el-form :model="form" label-width="100px">
          <el-form-item label="Booth ID">
            <el-input v-model="form.boothId" placeholder="例如: 123456" :disabled="dialogTitle==='编辑资源'" />
          </el-form-item>
          <el-form-item label="资源名称">
            <el-input v-model="form.assetName" />
          </el-form-item>
          <el-form-item label="预览图URL">
            <el-input v-model="form.previewImage" />
          </el-form-item>

          <!-- 在 el-form 内部 -->
        <el-row :gutter="20">
            <el-col :span="12">
                <el-form-item label="Booth ID">
                  <el-input v-model="form.boothId" :disabled="dialogTitle === '编辑资源'" />
                </el-form-item>
            </el-col>
            <el-col :span="12">
                <el-form-item label="类型">
                    <el-select v-model="form.assetType" placeholder="请选择">
                        <el-option label="其他 (0)" :value="0" />
                        <el-option label="模型 (1)" :value="1" />
                        <el-option label="衣服 (2)" :value="2" />
                        <el-option label="发型 (3)" :value="3" />
                    </el-select>
                </el-form-item>
            </el-col>
        </el-row>

        <el-form-item label="名称">
          <el-input v-model="form.assetName" />
        </el-form-item>
        
        <el-form-item label="中文名">
          <el-input v-model="form.assetChineseName" placeholder="可选，便于搜索" />
        </el-form-item>

        <el-form-item label="预览图">
          <el-input v-model="form.previewImage" />
        </el-form-item>

        <el-form-item label="适配模型">
           <el-input v-model="form.adaptAvatarsRaw" placeholder='输入适配模型，用逗号分隔 (如: milltina, eku)' />
        </el-form-item>

          <el-divider content-position="left">下载链接配置</el-divider>
          
          <div v-for="(link, index) in form.links" :key="index" class="link-edit-row">
            <div class="row-header">
                <span>链接 #{{ index + 1 }}</span>
                <el-button type="danger" link @click="removeLinkItem(index)">移除</el-button>
            </div>
            <el-row :gutter="10">
                <el-col :span="12"><el-input v-model="link.title" placeholder="链接标题 (如: Google Drive)" /></el-col>
                <el-col :span="12"><el-input v-model="link.downloadLink" placeholder="下载地址 URL" /></el-col>
            </el-row>
            <el-row :gutter="10" style="margin-top: 5px;">
                <el-col :span="12"><el-input v-model="link.imageUrl" placeholder="图标 URL (可选)" /></el-col>
                <el-col :span="12"><el-input v-model="link.description" placeholder="描述/密码 (可选)" /></el-col>
            </el-row>
          </div>
          <el-button type="primary" link :icon="Plus" @click="addLinkItem">添加一个下载链接</el-button>

        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped>
.admin-container { max-width: 1000px; margin: 40px auto; padding: 20px; background: white; border-radius: 8px; }
.login-box { max-width: 400px; margin: 100px auto; text-align: center; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-edit-row { background: #f5f7fa; padding: 15px; border-radius: 6px; margin-bottom: 10px; border: 1px dashed #dcdfe6; }
.row-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; color: #666; }
</style>