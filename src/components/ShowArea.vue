<script setup>
defineProps({
  boothId: String,
  ImageUrl: String,
  Title: String
})
</script>

<template>
  <div class="card">
    <div class="image-box">
      <img :src="ImageUrl" :alt="Title" loading="lazy" />
    </div>
    <div class="info">
      <div class="title" :title="Title">{{ Title }}</div>
      <div class="booth-id">ID: {{ boothId }}</div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.image-box {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  padding: 12px;
}

.title {
  font-weight: bold;
  font-size: 15px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.booth-id {
  font-size: 12px;
  color: #999;
}
</style>