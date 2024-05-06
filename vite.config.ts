import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/RESAS-JAPAN-POPULATION-GRAPH',
  build: {
    // GitHub Pages公開用に、docsディレクトリにビルド結果を出力
    outDir: 'docs',
  },
});
