<template>
  <div class="pg-shell">
    <aside class="pg-nav">
      <div class="pg-nav__brand">
        <strong>buildkit-primevue</strong>
        <span class="pg-badge pg-badge--ok">v{{ version }}</span>
      </div>
      <p class="pg-nav__note">
        Imported from <code>node_modules/buildkit-primevue</code> — rebuild the library
        (<code>npm run build</code> at the repo root) to pick up source changes.
      </p>
      <nav>
        <button
          v-for="d in demos"
          :key="d.id"
          class="pg-nav__item"
          :class="{'is-active': d.id === current.id}"
          @click="select(d.id)"
        >
          {{ d.title }}
        </button>
      </nav>
    </aside>

    <main class="pg-main">
      <DemoPane :key="current.id" :demo="current"/>
    </main>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue'
import {version} from 'buildkit-primevue'

import DemoPane from './components/DemoPane.vue'
import {demos, findDemo} from './demos'

const current = ref(findDemo(window.location.hash.slice(1)))

function select(id: string) {
  window.location.hash = id
  current.value = findDemo(id)
}

function onHashChange() {
  current.value = findDemo(window.location.hash.slice(1))
}

onMounted(() => window.addEventListener('hashchange', onHashChange))
onUnmounted(() => window.removeEventListener('hashchange', onHashChange))
</script>
