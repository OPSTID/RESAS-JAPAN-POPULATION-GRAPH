<template>
  <div class="tab" :class="{ 'is-selected': props.isSelected }">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  isSelected: boolean;
}>();
</script>
