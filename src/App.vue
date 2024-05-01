<template>
  <div class="responsive-wrapper">
    <!--ページタイトル-->
    <div class="label">
      <h1>Japan Population Graphs</h1>
      <p>都道府県を人口で比較してみよう</p>      
    </div>
    <!--表示モード選択-->
    <div class="tabs">
      <div
v-for="(modeName, mode) in {'all':'総人口','child':'年少人口','working':'生産年齢人口','old':'老年人口'}"
      :key="mode" class="tab" :class="{'is-selected': graphState.mode === mode}" @click="graphState.mode = mode">{{ modeName }}</div>
    </div>
    <!--グラフ-->
    <LineChart v-bind="lineChartProps"></LineChart>

    <!--都道府県の選択-->
    <details open>
      <summary>
        <div class="label">
          <h2>都道府県を選択</h2>
        </div>
      </summary>
      <div v-if="state.prefectures.length > 0" class="grid-4">
        <div v-for="pref in state.prefectures" :key="pref.prefCode" class="row-2">
          <label>
            <input v-model="state.selectedPrefectures[pref.prefCode]" type="checkbox">
            {{ pref.prefName }}
          </label>
        </div>
      </div>
    </details>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue';

import { LineChart, useLineChart } from 'vue-chart-3';
import { Chart, ChartData, registerables } from "chart.js"


Chart.register(...registerables)
// APIキー
const RESAS_API_KEY = "p4ZVGTtYIiI25gVj2CfIFdpq1wMCkmOiWPQ1jchy"

// 型定義
// 都道府県
declare type prefecture = {
  prefCode: number
  prefName: string
}
// 年ごとの値
declare type yearValue = {
  year: number
  value: number
}
// 人口構成のデータ
declare type prefPopulationData = {
  prefCode: number
  prefName: string
  data:{
    all: yearValue[], // 総人口
    child: yearValue[], // 年少人口
    working: yearValue[], // 生産年齢人口
    old: yearValue[] // 老年人口
  }
}

// 画面の状態
const state = reactive({
  // 都道府県一覧
  prefectures:<prefecture[]>[],
  // 都道府県の選択状態（indexを都道府県コードとして、その値がtrueなら選択されている）
  selectedPrefectures:<(boolean | undefined)[]>[],
})

// グラフの状態
const graphState = reactive({
  // 総人口、年少人口、生産年齢人口、老年人口のどれを表示するか
  mode:<"all" | "child" | "working" | "old"> "all",
  // 表示するデータセット
  datasets:<ChartData<"line">[]>[]
})


// グラフに表示するデータを生成
const graphData = computed<ChartData<'line'>>(() => ({
  labels:[1,2,3,4,5],
  datasets:[{
    label: "test data",
    data:[36,3,2,12,32],
    fill: false,
    tension:0
  }]
}))

// Viewに反映するデータの生成
const { lineChartProps } = useLineChart({
  chartData:graphData
})

// 都道府県の選択が変更されたとき
watchEffect(() => {
  // 選択された都道府県のコード
  let selectedPrefecturesCodes = <number[]>[]

  // それぞれの都道府県の選択状態を確認
  state.selectedPrefectures.forEach((isPrefSelected, index) => {
    if(isPrefSelected === true){
      // 選択されている場合は、その都道府県コードを保存
      selectedPrefecturesCodes.push(index)
    }
  })
  
  selectedPrefecturesCodes.forEach(async prefCode => {
    // それぞれの都道府県について、データを取得
    const res = await fetch(`https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?prefCode=${prefCode}&cityCode=-`,{
      headers:{
        "X-API-KEY":RESAS_API_KEY
      }
    })
    
  })
})

// 都道府県一覧をRESAS APIから取得
const getPrefectures = async () => {
  const res = await fetch("https://opendata.resas-portal.go.jp/api/v1/prefectures",{
    headers:{
      "X-API-KEY":RESAS_API_KEY
    }
  })
  // 都道府県一覧を反映
  state.prefectures = <prefecture[]>(await res.json()).result

  // 都道府県の選択状態を初期化する
  for(let i = 1; i <= state.prefectures.length; i++){
    state.selectedPrefectures[i] = false;
  }
}

getPrefectures()
</script>