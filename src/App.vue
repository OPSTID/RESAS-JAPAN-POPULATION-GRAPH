<template>
  <div class="responsive-wrapper">
    <!--ページタイトル-->
    <div class="text-center">
      <div class="label">
        <h1>Japan Population Charts</h1>
        <p>都道府県を人口で比較してみよう</p>
      </div>
    </div>
    <!--読込中-->
    <div v-if="state.isLoading" class="text-center"><img src="/loading.svg" class="loading-icon" /> <br />データを取得中</div>
    <div v-else class="main">
      <!--表示モード選択-->
      <div class="tabs">
        <div
          v-for="(modeName, mode) in { all: '総人口', child: '年少人口', working: '生産年齢人口', old: '老年人口' }"
          :key="mode"
          class="tab"
          :class="{ 'is-selected': state.mode === mode }"
          @click="state.mode = mode"
        >
          {{ modeName }}
        </div>
      </div>
      <!--グラフ-->
      <Chart
        :size="{ width: chartState.width, height: 300 }"
        :data="chartState.data"
        :margin="chartState.margin"
        :direction="chartState.direction"
        :axis="chartState.axis"
      >
        <template #layers>
          <Grid stroke-dasharray="2,2" />
          <Line :data-keys="['name', 'pl']" />
          <Line :data-keys="['name', 'avg']" :line-style="{ stroke: 'red' }" type="step" />
        </template>

        <template #widgets>
          <Tooltip
            border-color="#48CAE4"
            :config="{
              name: { hide: true },
              pl: { color: '#0077b6' },
              avg: { label: 'averange', color: 'red' },
              inc: { hide: true },
            }"
          />
        </template>
      </Chart>
      <div class="label">
        <h2>都道府県の選択</h2>
        <p>グラフに表示する都道府県を選んでください</p>
      </div>

      <!--都道府県の選択-->
      <div v-if="state.prefectures.length > 0" class="grid-4">
        <div v-for="pref in state.prefectures" :key="pref.prefCode" class="row-2">
          <label>
            <input v-model="state.selectedPrefectures[pref.prefCode]" type="checkbox" />
            {{ pref.prefName }}
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import { prefecture, prefPopulationAPIResponse, prefPopulationData } from './types';
import { Chart, Grid, Line, Tooltip } from 'vue3-charts';
import { ChartAxis, Direction } from 'vue3-charts/dist/types';

// APIキー
// 事前にプロジェクトルートに .env.local ファイルを作成の上、RESAS_API_KEY="(APIキー)"の形式でAPIキーを設定しておくこと。
const RESAS_API_KEY = import.meta.env.RESAS_API_KEY;

// 画面の状態
const state = reactive({
  // 都道府県一覧、各都道府県の情報を読込中のときtrue
  isLoading: true,
  // 都道府県一覧
  prefectures: <prefecture[]>[],
  // 都道府県の選択状態（indexを都道府県コードとして、その値がtrueなら選択されている）
  selectedPrefectures: <(boolean | undefined)[]>[],
  // 選択されている都道府県の都道府県コード一覧
  selectedPrefecturesCodes: <number[]>[],

  // 総人口、年少人口、生産年齢人口、老年人口のどれを表示するか
  mode: <'all' | 'child' | 'working' | 'old'>'all',
});

// グラフの状態
const chartState = reactive({
  width: 0,
  data: [
    { name: 'Jan', pl: 1000, avg: 500, inc: 300 },
    { name: 'Feb', pl: 2000, avg: 900, inc: 400 },
    { name: 'Apr', pl: 400, avg: 400, inc: 500 },
    { name: 'Mar', pl: 3100, avg: 1300, inc: 700 },
    { name: 'May', pl: 200, avg: 100, inc: 200 },
    { name: 'Jun', pl: 600, avg: 400, inc: 300 },
    { name: 'Jul', pl: 500, avg: 90, inc: 100 },
  ],
  direction: <Direction>'horizontal',
  margin: {
    left: 0,
    top: 20,
    right: 20,
    bottom: 0,
  },
  axis: <ChartAxis>{
    primary: {
      type: 'band',
    },
    secondary: {
      domain: ['dataMin', 'dataMax + 100'],
      type: 'linear',
      ticks: 8,
    },
  },
});

// 画面のサイズに合わせてグラフの横幅を設定する
const adjustChartWidth = () => {
  chartState.width = Math.min(650, window.innerWidth - 40);
};
adjustChartWidth();
// 画面サイズが変わる度に設定
window.addEventListener('resize', adjustChartWidth);

// インデックスを都道府県コードとして、各都道府県のprefPopulationDataを格納
let prefPopulationDataArray = <prefPopulationData[]>[];

// 都道府県一覧、各都道府県の人口構成をRESAS APIから取得
const getPrefecturesAndInfo = () => {
  // 読込中にする
  state.isLoading = true;
  // 都道府県一覧を取得
  fetch('https://opendata.resas-portal.go.jp/api/v1/prefectures', {
    headers: {
      'X-API-KEY': RESAS_API_KEY,
    },
  })
    .then(async (res) => {
      // 都道府県一覧を反映
      // 正常に受信できたとき
      if (res.ok) {
        state.prefectures = <prefecture[]>(await res.json()).result;
        // 都道府県の選択状態を初期化する
        for (let i = 1; i <= state.prefectures.length; i++) {
          state.selectedPrefectures[i] = false;
        }

        // 各都道府県の人口構成を取得する
        state.prefectures.forEach((pref) => {
          fetch(`https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?prefCode=${pref.prefCode}&cityCode=-`, {
            headers: {
              'X-API-KEY': RESAS_API_KEY,
            },
          })
            .then(async (res) => {
              if (res.ok) {
                const prefPopulationAPIResult = <prefPopulationAPIResponse>await res.json();

                // APIから取得したデータをもとに、人口構成データを作成する
                // 作成するデータ
                let populationData = <prefPopulationData['data']>{
                  all: [],
                  child: [],
                  working: [],
                  old: [],
                };
                // 総人口、年少人口、生産年齢人口、老年人口をdata.labelをもとにして判別。
                // populationData に反映する。

                // APIから正しい形式でデータを取得できているかを確認
                if (!!prefPopulationAPIResult.result && !!prefPopulationAPIResult.result.data) {
                  prefPopulationAPIResult.result.data.forEach((data) => {
                    switch (data.label) {
                      case '総人口':
                        populationData.all = data.data;
                        break;
                      case '年少人口':
                        populationData.child = data.data;
                        break;
                      case '生産年齢人口':
                        populationData.working = data.data;
                        break;
                      case '老年人口':
                        populationData.old = data.data;
                        break;
                    }
                  });

                  // 保存
                  prefPopulationDataArray[pref.prefCode] = {
                    prefName: pref.prefName,
                    prefCode: pref.prefCode,
                    data: populationData,
                  };

                  // 47都道府県すべてのデータが揃ったら、都道府県コードを昇順に並べ替えたあと、読み込み終了
                  let prefCount = 0;
                  prefPopulationDataArray.forEach((pref) => {
                    if (!!pref && !!pref.data) {
                      prefCount++;
                    }
                  });
                  if (prefCount === state.prefectures.length) {
                    // 都道府県コードで並べ替える
                    prefPopulationDataArray = prefPopulationDataArray.sort((prev, next) => {
                      return prev.prefCode - next.prefCode;
                    });

                    state.isLoading = false;
                  }
                } else {
                  alert('APIからの応答が正しい形式でないため処理できなくなりました。ページをリロードすると解決する場合があります。');
                }
              } else {
                alert('RESAS APIから情報を取得できません。ページをリロードしてください。');
              }
            })
            .catch(() => {
              alert('RESAS APIのサーバーに接続できません。ページをリロードしてください。');
            });
        });
      } else {
        alert('RESAS APIから情報を取得できません。ページをリロードしてください。');
        // 処理を終了
        return;
      }
    })
    .catch(() => {
      alert('RESAS APIのサーバーに接続できません。ページをリロードしてください。');
    });
};

// ページアクセス時にRESAS APIからの情報取得を行う
getPrefecturesAndInfo();
</script>
