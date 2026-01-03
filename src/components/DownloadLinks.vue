<script setup>
defineProps({
  Title: String,
  Link: String,
  Image: String,
  Description: String
})

const openLink = (url) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="download-item" @click="openLink(Link)">
    <div class="icon-box" v-if="Image">
      <img :src="Image" alt="icon" />
    </div>
    <div class="text-box">
      <div class="link-title">{{ Title }}</div>
      <div class="link-desc" v-if="Description">{{ Description }}</div>
    </div>
    <div class="arrow">➜</div>
  </div>
</template>

<style scoped>
.download-item {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.download-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.icon-box img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
  object-fit: cover;
}

.text-box {
  flex: 1;
}

.link-title {
  font-weight: bold;
  color: #333;
}

.link-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.arrow {
  color: #ccc;
  font-weight: bold;
}
</style>