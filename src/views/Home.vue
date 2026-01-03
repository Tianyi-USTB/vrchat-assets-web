<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import ShowArea from '../components/ShowArea.vue'

const router = useRouter()
const assets = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentType = ref('all')
const currentChar = ref('') // 新增：当前选中的角色

// 常用 VRChat 角色预设 (你可以随意添加)
const charOptions = [
  { value: 'Milltina', label: 'Milltina' },
  { value: 'Eku', label: 'Eku' },
  { value: 'Shinano', label: 'Shinano' },
  { value: 'Kikyo', label: 'Kikyo' },
  { value: 'Moe', label: 'Moe' },
  { value: 'Manuka', label: 'Manuka' },
  { value: 'Selestia', label: 'Selestia' },
  { value: 'Lime', label: 'Lime' },
  { value: 'Milfy', label: 'Milfy' },
  { value: 'Maya', label: 'Maya' }
]

const fetchAssets = async () => {
  loading.value = true
  try {
    // 构造查询参数
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('q', searchQuery.value)
    if (currentType.value !== 'all') params.append('type', currentType.value)
    if (currentChar.value) params.append('char', currentChar.value) // 传给后端
    
    const res = await axios.get(`/api/assets?${params.toString()}`)
    assets.value = res.data
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/${id}`)
}

// 监听任何筛选条件变化，自动搜索
watch([currentType, currentChar], () => {
  fetchAssets()
})

onMounted(() => {
  fetchAssets()
})
</script>

<template>
  <div class="home-container">
    <div class="header">
      <h1>VRChat Assets</h1>
      
      <!-- 搜索栏行 -->
      <div class="filter-row">
        <!-- 关键词搜索 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索名称、ID..."
          class="search-input"
          clearable
          @keyup.enter="fetchAssets"
        >
          <template #append>
            <el-button @click="fetchAssets">搜索</el-button>
          </template>
        </el-input>

        <!-- 角色筛选 (关键新增) -->
        <el-select
          v-model="currentChar"
          placeholder="按角色筛选"
          filterable
          allow-create
          clearable
          class="char-select"
          default-first-option
          :reserve-keyword="false"
        >
          <el-option
            v-for="item in charOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-button type="info" link @click="router.push('/admin')">管理后台</el-button>
      </div>

      <!-- 分类标签页 -->
      <div class="category-tabs">
        <el-radio-group v-model="currentType" size="large">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="1">模型</el-radio-button>
          <el-radio-button label="2">衣服</el-radio-button>
          <el-radio-button label="3">发型/饰品</el-radio-button>
          <el-radio-button label="0">其他</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="assets.length > 0" class="assets-grid">
      <ShowArea
        v-for="item in assets"
        :key="item.boothId"
        :boothId="item.boothId"
        :Title="item.assetName"
        :ImageUrl="item.previewImage"
        @click="goToDetail(item.boothId)"
      />
    </div>

    <div v-else class="empty-state">
      <el-empty description="没有找到相关资源" />
    </div>
  </div>
</template>

<style scoped>
.home-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.header { text-align: center; margin-bottom: 30px; }

/* 筛选行样式优化 */
.filter-row {
  max-width: 800px;
  margin: 20px auto;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap; /* 手机端自动换行 */
}
.search-input { flex: 2; min-width: 200px; }
.char-select { flex: 1; min-width: 160px; }

.assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.loading-state, .empty-state { margin-top: 50px; text-align: center; }
.category-tabs { margin-top: 20px; }
</style>