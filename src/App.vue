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
      <div class="card-inset is-relative">
        <!--都道府県が選択されているときはグラフを表示-->
        <div>
          <Chart :options="chartState.charOptions"></Chart>
        </div>
        <!--都道府県が1つも選択されていなければ、メッセージを表示-->
        <div v-if="state.selectedPrefsCodes.length === 0" class="text-center is-absolute-center" style="height: 10em; padding: 10px">
          <div class="label">
            <h1>🤔</h1>
          </div>
          <br />
          <div class="label">
            <h2>都道府県を選択してください</h2>
            <p>人口推移グラフを表示するには1つ以上の都道府県を選択する必要があります</p>
          </div>
        </div>
      </div>
      <!--都道府県の選択-->
      <div v-if="state.prefs.length > 0" class="card-inset">
        <div class="label">
          <h2>都道府県の選択</h2>
          <p>グラフに表示する都道府県を選んでください</p>
        </div>
        <div class="grid-4">
          <div v-for="pref in state.prefs" :key="pref.prefCode" class="row-2">
            <label>
              <input v-model="state.selectedPrefs[pref.prefCode]" type="checkbox" />
              {{ pref.prefName }}
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, watchEffect } from 'vue';
import { Prefecture, PrefPopulationAPIResponse, PrefPopulationData } from './types';
import { Chart } from 'highcharts-vue';
import * as Highcharts from 'highcharts';

// RESAS APIキー
// ビルド前にプロジェクトルートに .env.local ファイルを作成の上、VITE_RESAS_API_KEY="(APIキー)"の形式でAPIキーを設定しておくこと。
const RESAS_API_KEY = import.meta.env.VITE_RESAS_API_KEY;

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
let prefPopulationDataArray = <PrefPopulationData[]>[];

// 都道府県一覧、各都道府県の人口構成をRESAS APIから取得
const getPrefAndInfo = () => {
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
        state.prefs = <Prefecture[]>(await res.json()).result;
        // 都道府県の選択状態を初期化する
        for (let i = 1; i <= state.prefs.length; i++) {
          state.selectedPrefs[i] = false;
        }

        // 各都道府県の人口構成を取得する
        // prefPopulationDataArray を初期化
        prefPopulationDataArray = [];
        state.prefs.forEach((pref) => {
          fetch(`https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?prefCode=${pref.prefCode}&cityCode=-`, {
            headers: {
              'X-API-KEY': RESAS_API_KEY,
            },
          })
            .then(async (res) => {
              if (res.ok) {
                const prefPopulationAPIResult = <PrefPopulationAPIResponse>await res.json();

                // APIから取得したデータをもとに、人口構成データを作成する
                // 作成するデータ
                let populationData = <PrefPopulationData['data']>{
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
                  let prefCount = prefPopulationDataArray.filter((pref) => {
                    return !!pref && !!pref.data;
                  }).length;
                  if (prefCount === state.prefs.length) {
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
                alert('RESAS APIから情報を取得できません。ページをリロードしてください。(DL_E2_2)');
              }
            })
            .catch(() => {
              alert('RESAS APIのサーバーに接続できません。ページをリロードしてください。(DL_E1_2)');
            });
        });
      } else {
        // 500エラーなどが発生したとき
        alert('RESAS APIから情報を取得できません。ページをリロードしてください。(DL_E2_1)');
        // 処理を終了
        return;
      }
    })
    .catch(() => {
      // RESAS APIのサーバーに接続できないとき
      alert('RESAS APIのサーバーに接続できません。ページをリロードしてください。(DL_E1_1)');
    });
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
  // prefPopulationDataArray（ダウンロード済み都道府県情報）から選択された都道府県の情報を抽出
  // 選択された都道府県の情報
  let selectedPrefsDataArray = prefPopulationDataArray.filter((pref) => {
    return selectedPrefsCodes.indexOf(pref.prefCode) !== -1;
  });

  // グラフを初期化
  chartState.charOptions.series = [];
  selectedPrefsDataArray.forEach((pref) => {
    if (!!pref.data[state.mode] && pref.data[state.mode].length > 0) {
      // [0]: 年、[1]: 人口数とした座標 の配列を作成
      let xys = <number[][]>[];
      pref.data[state.mode].forEach((yearValue) => {
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
