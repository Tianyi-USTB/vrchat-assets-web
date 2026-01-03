<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import DownloadLinks from '../components/DownloadLinks.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const asset = ref(null)
const links = ref([])
const loading = ref(true)
const error = ref(false)

// === 修复点 1: 计算属性必须判空 ===
// 如果 asset.value 为 null，直接返回空数组/默认值，防止报错
const adaptList = computed(() => {
  if (!asset.value || !asset.value.adaptAvatars) return []
  const raw = asset.value.adaptAvatars
  // 数据库可能是 JSON 字符串，也可能是对象，做个兼容
  return typeof raw === 'string' ? JSON.parse(raw) : raw
})

const tagList = computed(() => {
  if (!asset.value || !asset.value.tags) return []
  const raw = asset.value.tags
  return typeof raw === 'string' ? JSON.parse(raw) : raw
})

const typeName = computed(() => {
  if (!asset.value) return ''
  const map = { 0: '其他', 1: '模型', 2: '衣服', 3: '发型/饰品' }
  return map[asset.value.assetType] || '未知'
})

onMounted(async () => {
  try {
    const res = await axios.get(`/api/assets?id=${id}`)
    // 这里确保赋值
    asset.value = res.data.asset
    links.value = res.data.links || []
  } catch (e) {
    console.error("加载详情失败:", e)
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="detail-page">
    <div class="nav-bar">
      <el-button @click="router.push('/')">← 返回列表</el-button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="error-box">
      <el-empty description="资源不存在或加载失败" />
    </div>

    <!-- 
      === 修复点 2: 关键修改 === 
      使用 v-else-if="asset" 而不是 v-else。
      这确保了只有当 asset 有数据时，才会渲染内部的 asset.assetName
    -->
    <div v-else-if="asset" class="content-box">
      
      <!-- 左侧图片 -->
      <div class="left-col">
        <div class="main-img-wrapper">
            <!-- 增加 ?. 防止极个别情况报错 -->
            <el-image 
                v-if="asset.previewImage"
                :src="asset.previewImage" 
                fit="contain" 
                :preview-src-list="[asset.previewImage]"
                hide-on-click-modal
            />
        </div>
      </div>

      <!-- 右侧信息 -->
      <div class="right-col">
        <h1 class="asset-name">{{ asset.assetName }}</h1>
        
        <div class="meta-row">
            <el-tag type="info">ID: {{ asset.boothId }}</el-tag>
            <el-tag :type="asset.assetType === 1 ? 'success' : 'warning'" style="margin-left: 10px">
                {{ typeName }}
            </el-tag>
            <span v-if="asset.assetChineseName" class="cn-name">({{ asset.assetChineseName }})</span>
        </div>

        <!-- 标签 -->
        <div v-if="tagList.length > 0" class="tags-section">
            <el-tag v-for="tag in tagList" :key="tag" effect="plain" round size="small" style="margin-right: 5px">
                #{{ tag }}
            </el-tag>
        </div>

        <!-- 适配列表 -->
        <div v-if="adaptList.length > 0" class="adapt-section">
            <div class="section-title">适配模型 (Supported Avatars):</div>
            <div class="adapt-list">
                <el-check-tag checked v-for="avatar in adaptList" :key="avatar" class="adapt-item">
                    {{ avatar }}
                </el-check-tag>
            </div>
        </div>

        <el-divider content-position="left">下载资源</el-divider>

        <div class="links-list">
          <DownloadLinks
            v-for="(link, index) in links"
            :key="index"
            :Title="link.title"
            :Link="link.downloadLink"
            :Image="link.imageUrl"
            :Description="link.description"
          />
          <div v-if="links.length === 0" class="no-links">
            暂无下载链接
          </div>
        </div>
      </div>
    </div>
    
    <!-- 数据为空的兜底 -->
    <div v-else class="error-box">
       <el-empty description="数据异常" />
    </div>

  </div>
</template>

<style scoped>
.detail-page {
  max-width: 1000px;
  margin: 40px auto;
  padding: 20px;
}
.nav-bar { margin-bottom: 20px; }
.content-box {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 40px;
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

@media (max-width: 768px) {
    .content-box { grid-template-columns: 1fr; }
}

.main-img-wrapper {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #eee;
  background: #f9f9f9;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.asset-name { margin-top: 0; font-size: 28px; color: #333; }
.meta-row { margin-bottom: 15px; display: flex; align-items: center; flex-wrap: wrap; }
.cn-name { margin-left: 10px; color: #666; font-size: 16px; }
.tags-section { margin-bottom: 15px; }
.adapt-section { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.section-title { font-size: 13px; font-weight: bold; color: #666; margin-bottom: 8px; }
.adapt-item { margin-right: 8px; margin-bottom: 8px; }
.no-links { color: #999; font-style: italic; }
</style>