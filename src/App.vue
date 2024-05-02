<template>
  <div class="responsive-wrapper">
    <!--ページタイトル-->
    <div class="label">
      <h1>Japan Population charts</h1>
      <p>都道府県を人口で比較してみよう</p>
    </div>
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
    <LineChart v-if="Object.keys(chartState.chartData).length > 0" :chart-data="chartState.chartData"></LineChart>

    <!--都道府県の選択-->
    <div class="label">
      <h2>Select Prefectures</h2>
      <p>グラフに表示する都道府県を選んでください</p>
    </div>
    <div v-if="state.prefectures.length > 0" class="grid-4">
      <div v-for="pref in state.prefectures" :key="pref.prefCode" class="row-2">
        <label>
          <input v-model="state.selectedPrefectures[pref.prefCode]" type="checkbox" />
          {{ pref.prefName }}
        </label>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue';

import { LineChart } from 'vue-chart-3';
import { Chart, ChartData, registerables } from 'chart.js';

Chart.register(...registerables);
// APIキー
const RESAS_API_KEY = 'p4ZVGTtYIiI25gVj2CfIFdpq1wMCkmOiWPQ1jchy';

// 型定義
// 都道府県
declare type prefecture = {
  prefCode: number;
  prefName: string;
};
// 年ごとの値
declare type yearValue = {
  year: number;
  value: number;
};
// 人口構成のデータ
declare type prefPopulationData = {
  prefCode: number;
  prefName: string;
  data: {
    all: yearValue[]; // 総人口
    child: yearValue[]; // 年少人口
    working: yearValue[]; // 生産年齢人口
    old: yearValue[]; // 老年人口
  };
};
// 人口構成APIのレスポンス
declare type prefPopulationAPIResponse = {
  message: any;
  result: {
    boundaryYear: number;
    data: {
      data: {
        year: number;
        value: number;
      }[];
      label: string;
    }[];
  };
};

// 画面の状態
const state = reactive({
  // 都道府県一覧
  prefectures: <prefecture[]>[],
  // 都道府県の選択状態（indexを都道府県コードとして、その値がtrueなら選択されている）
  selectedPrefectures: <(boolean | undefined)[]>[],
  selectedPrefecturesCodes: <number[]>[],

  // 総人口、年少人口、生産年齢人口、老年人口のどれを表示するか
  mode: <'all' | 'child' | 'working' | 'old'>'all',
});

// 選択された各都道府県の人口データ
let selectedPrefecturesDataArray = ref(<prefPopulationData[]>[])

// グラフの状態
const chartState = reactive({
  // vue-chart-3 で使用するグラフの内容。初期値としてサンプルデータを書いておく
  chartData: computed<ChartData<'line'>>(() => ({
    labels: [1, 2, 3, 4, 5],
    datasets: [
      {
        label: 'test data',
        data: [36, 3, 2, 12, 32],
        fill: false,
        tension: 0,
      },
    ],
  })),
});

// グラフの生成
const renderchart = () => {
  // 表示するデータがあるかを確認
  if (selectedPrefecturesDataArray.value.length > 0) {
    // グラフに表示するデータを生成
    const chartData = computed<ChartData<'line'>>(() => ({
      labels: [1, 2, 3, 4, 5],
      datasets: [
        {
          label: 'test data',
          data: [1, 2, 3, 4, 5],
          fill: false,
          tension: 0,
        },
      ],
    }));

    chartState.chartData = chartData;
  }
};

// 都道府県の選択が変更されたとき
watchEffect(() => {
  // 選択された都道府県のコード
  let selectedPrefecturesCodes = <number[]>[];

  // それぞれの都道府県の選択状態を確認
  state.selectedPrefectures.forEach((isPrefSelected, index) => {
    if (isPrefSelected === true) {
      // 選択されている場合は、その都道府県コードを保存
      selectedPrefecturesCodes.push(index);
    }
  });

  state.selectedPrefecturesCodes = selectedPrefecturesCodes

  // APIから取得した情報をこの配列に保存
  let _selectedPrefecturesDataArray = <prefPopulationData[]>[];
  // 選択されている都道府県それぞれのデータを処理
  selectedPrefecturesCodes.forEach(async (prefCode) => {
    // 都道府県名を取得
    let prefName = '';
    if (1 <= prefCode && prefCode <= 47 && state.prefectures.length > 0) {
      state.prefectures.forEach((pref) => {
        if (pref.prefCode === prefCode) {
          prefName = pref.prefName;
        }
      });
    }

    // 都道府県の人口データを取得
    const res = await fetch(`https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?prefCode=${prefCode}&cityCode=-`, {
      headers: {
        'X-API-KEY': RESAS_API_KEY,
      },
    });

    // 取得結果を処理
    const result = (<prefPopulationAPIResponse | undefined>await res.json())?.result;
    if (!!result && !!result.data) {
      if (Array.isArray(result.data)) {
        // 取得した各人口データを保存するオブジェクト
        let populationData = <prefPopulationData['data']>{
          all: <yearValue[]>[],
          child: <yearValue[]>[],
          working: <yearValue[]>[],
          old: <yearValue[]>[],
        };
        result.data.forEach((prefData) => {
          switch (prefData.label) {
            case '総人口':
              populationData.all = prefData.data;
              break;
            case '年少人口':
              populationData.child = prefData.data;
              break;
            case '生産年齢人口':
              populationData.working = prefData.data;
              break;
            case '老年人口':
              populationData.old = prefData.data;
              break;
          }
        });

        _selectedPrefecturesDataArray.push({
          prefCode,
          prefName,
          data: populationData,
        });
      }
    }
  });

  // 一旦空にする
  selectedPrefecturesDataArray.value = _selectedPrefecturesDataArray;

  // グラフの作成
  // renderchart();
});

// 都道府県一覧をRESAS APIから取得
const getPrefectures = async () => {
  const res = await fetch('https://opendata.resas-portal.go.jp/api/v1/prefectures', {
    headers: {
      'X-API-KEY': RESAS_API_KEY,
    },
  });
  // 都道府県一覧を反映
  state.prefectures = <prefecture[]>(await res.json()).result;

  // 都道府県の選択状態を初期化する
  for (let i = 1; i <= state.prefectures.length; i++) {
    state.selectedPrefectures[i] = false;
  }
};

getPrefectures();
</script>
