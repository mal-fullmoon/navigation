<template>
  <div class="home">
    <MapContainer msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import MapContainer from '@/components/MapContainer.vue'

export default {
  name: 'Home',
  components: {
    MapContainer
  }
}
</script>
<style>
.home{
	height: 100%;
	position: relative;
}
</style>
