<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in" appear>
      <component :is="Component" :key="$route.fullPath" />
    </transition>
  </router-view>
</template>
