<template>
  <div class="responsive-wrapper">
    <!--ページタイトル-->
    <div class="text-center">
      <v-label>
        <h1>Japan Population Charts</h1>
        <p>都道府県を人口で比較してみよう</p>
      </v-label>
    </div>
    <!--読込中-->
    <v-loading v-if="state.isLoading" />
    <div v-else class="main">
      <!--表示モード選択-->
      <v-tabs>
        <v-tab
          v-for="(modeName, mode) in { all: '総人口', child: '年少人口', working: '生産年齢人口', old: '老年人口' }"
          :key="mode"
          :is-selected="state.mode === mode"
          @click="state.mode = mode"
        >
          {{ modeName }}
        </v-tab>
      </v-tabs>
      <!--グラフ-->
      <v-card-inset class="is-relative">
        <!--グラフ表示-->
        <Chart
          :options="chartState.charOptions"
          :style="{
            opacity: state.selectedPrefsCodes.length === 0 ? 0.2 : 1,
            filter: state.selectedPrefsCodes.length === 0 ? 'blur(2px)' : 'none',
          }"
        ></Chart>
        <!--都道府県が1つも選択されていなければ、メッセージを表示-->
        <div v-if="state.selectedPrefsCodes.length === 0" class="text-center is-absolute-center" style="height: 10em; padding: 10px">
          <v-label>
            <h1>🤔</h1>
          </v-label>
          <br />
          <v-label>
            <h2>都道府県を選択してください</h2>
            <p>人口推移グラフを表示するには1つ以上の都道府県を選択する必要があります</p>
          </v-label>
        </div>
      </v-card-inset>
      <v-card-inset v-if="state.prefs.length > 0">
        <v-label>
          <h2>都道府県の選択</h2>
          <p>グラフに表示する都道府県を選んでください</p>
        </v-label>
        <div class="grid-4">
          <div v-for="pref in state.prefs" :key="pref.prefCode" class="row-2">
            <label>
              <input v-model="state.selectedPrefs[pref.prefCode]" type="checkbox" />
              {{ pref.prefName }}
            </label>
          </div>
        </div>
      </v-card-inset>
      <v-card-inset>
        <v-label>
          <p>
            <a href="https://opendata.resas-portal.go.jp/" target="_blank">RESAS API</a> から取得した情報をもとに表示しています。<br />著作権表示: ©
            Cabinet Office,Government Of Japan. All Rights Reserved.
          </p>
          <p><a href="javascript:void(0)" @click="getPrefAndInfo()">データの再取得</a></p>
        </v-label>
      </v-card-inset>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, watchEffect } from 'vue';
import { Chart } from 'highcharts-vue';
import * as Highcharts from 'highcharts';

import { Prefecture, PrefPopulationData } from './types';
import { getPrefs, getPrefsPopulation } from './resas-api';

import vLoading from './components/v-loading.vue';
import vCardInset from './components/v-card-inset.vue';
import vLabel from './components/v-label.vue';
import vTabs from './components/v-tabs.vue';
import vTab from './components/v-tab.vue';

// 画面の状態
const state = reactive({
  // 都道府県一覧、各都道府県の情報を読込中のときtrue
  isLoading: true,
  // 都道府県一覧
  prefs: <Prefecture[]>[],
  // 都道府県の選択状態（indexを都道府県コードとして、その値がtrueなら選択されている）
  selectedPrefs: <(boolean | undefined)[]>[],
  // 選択された都道府県コードリスト
  selectedPrefsCodes: <number[]>[],

  // 総人口、年少人口、生産年齢人口、老年人口のどれを表示するか
  mode: <'all' | 'child' | 'working' | 'old'>'all',
});

// グラフの状態
const chartState = reactive({
  charOptions: <Highcharts.Options>{
    title: {
      text: '人口推移',
    },
    yAxis: {
      title: {
        text: '人口（人）',
      },
      labels: {
        // コンマ区切りで人口を表示
        format: '{value:,.0f}',
      },
    },
    xAxis: {
      title: {
        text: '年',
      },
    },
    series: [
      // 型定義に使用するため、サンプルデータを定義
      {
        name: 'A',
        data: [
          [1, 1],
          [2, 2],
          [3, 3],
        ], // sample data
      },
    ],
  },
});

// インデックスを都道府県コードとして、各都道府県のprefPopulationDataを格納
let prefPopulationDatas = <PrefPopulationData[]>[];

// 都道府県一覧、各都道府県の人口構成をRESAS APIから取得
const getPrefAndInfo = async () => {
  // 読込中にする
  state.isLoading = true;
  // 都道府県一覧を取得
  state.prefs = await getPrefs();

  // 都道府県が正しく取得できているとき
  if (state.prefs.length > 0) {
    // 都道府県の選択状態を初期化する
    for (let i = 1; i <= state.prefs.length; i++) {
      state.selectedPrefs[i] = false;
    }

    // 各都道府県の人口構成を取得
    prefPopulationDatas = await getPrefsPopulation(state.prefs);
    // 各都道府県の人口構成を正しく取得できれば、ローディング表示を終了
    if (prefPopulationDatas.length === 48) {
      state.isLoading = false;
    }
  }
};

// ページアクセス時にRESAS APIからの情報取得を行う
getPrefAndInfo();

// 都道府県・モードの選択変更時、グラフを変更
watchEffect(() => {
  // 選択されている都道府県の都道府県コードのリストを作成
  let selectedPrefsCodes = <number[]>[];

  state.selectedPrefs.forEach((isSelected, prefCode) => {
    if (isSelected) {
      selectedPrefsCodes.push(prefCode);
    }
  });

  // state に反映
  state.selectedPrefsCodes = selectedPrefsCodes;

  // 都道府県コードリストをもとにhighcharts用データを生成
  // prefPopulationDatas（ダウンロード済み都道府県情報）から選択された都道府県の情報を抽出
  let selectedPrefsPopulationDatas = prefPopulationDatas.filter((pref) => {
    return selectedPrefsCodes.indexOf(pref.prefCode) !== -1;
  });

  // グラフを初期化
  chartState.charOptions.series = [];
  // グラフ用データの生成
  selectedPrefsPopulationDatas.forEach((pref) => {
    if (!!pref.data[state.mode] && pref.data[state.mode]!.length > 0) {
      // [0]: 年、[1]: 人口数とした座標 の配列を作成
      let xys = <number[][]>[];
      pref.data[state.mode]!.forEach((yearValue) => {
        xys.push([yearValue.year, yearValue.value]);
      });
      // グラフに追加
      chartState.charOptions.series?.push(<(typeof chartState.charOptions.series)[number]>{
        name: pref.prefName,
        data: xys,
      });
    }
  });
});
</script>
