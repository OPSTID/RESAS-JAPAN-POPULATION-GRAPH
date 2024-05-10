/**
 * RESAS API Wrapper
 * RESAS APIから情報を取得して、適切な形で返す関数群
 */

import { PrefPopulationAPIResponse, PrefPopulationData, Prefecture } from './types';

// RESAS APIキーを環境変数から取得
const RESAS_API_KEY = <string | undefined>import.meta.env.VITE_RESAS_API_KEY;
if (RESAS_API_KEY === undefined) {
  throw new Error("Please create '.env.local' file correctly in project root. See README.md for more details.");
}

// 都道府県一覧を取得
export const getPrefs = async () => {
  try {
    // 都道府県一覧をRESAS APIから取得
    const res = await fetch('https://opendata.resas-portal.go.jp/api/v1/prefectures', {
      headers: {
        'X-API-KEY': RESAS_API_KEY,
      },
    });
    // 正常に取得できたとき
    if (res.ok) {
      // 都道府県一覧を返す
      return <Prefecture[]>(await res.json()).result;
    } else {
      if (
        // 500エラーなどが発生したとき
        confirm('RESAS APIから情報を取得できません。ページをリロードしますか？(DL_E2_1)')
      ) {
        location.reload();
      }
      return [];
    }
  } catch (e) {
    // RESAS APIのサーバーに接続できないとき
    // ページをリロードするか確認
    if (confirm('RESAS APIのサーバーに接続できません。ページをリロードしますか？(DL_E1_1)')) {
      location.reload();
    }
    return [];
  }
};

// 各都道府県の人口構成を取得
export const getPrefsPopulation = (prefs: Prefecture[]): Promise<PrefPopulationData[]> => {
  // 結果をreturnで返すと、prefs.foreachでの遅延の影響で返り値のlengthが0になるので、Promiseを使用する
  return new Promise((resolve) => {
    try {
      // indexを都道府県コードとして、各都道府県のPrefPopulationDataを格納
      let prefPopulationDatas = <PrefPopulationData[]>[];

      // 各都道府県の人口構成をRESAS APIから取得
      prefs.forEach(async (pref) => {
        const res = await fetch(`https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear?prefCode=${pref.prefCode}&cityCode=-`, {
          headers: {
            'X-API-KEY': RESAS_API_KEY,
          },
        });
        // 正常に取得できたとき
        if (res.ok) {
          const apiResult = <PrefPopulationAPIResponse>await res.json();

          // APIから取得したデータをもとに、本アプリで使用する人口構成データを作成する。
          // 作成するデータ
          let populationData = <PrefPopulationData['data']>{
            all: [], // 総人口
            child: [], // 年少人口
            working: [], // 生産年齢人口
            old: [], // 老年人口
          };

          // 総人口、年少人口、生産年齢人口、老年人口をapiResult.result.data[].data.labelをもとにして判別。
          // APIから正しい形式でデータを取得できているかを確認
          if (!!apiResult.result && !!apiResult.result.data) {
            apiResult.result.data.forEach((data) => {
              // data.labelをもとにpopulationDataに反映する
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
          }

          // prefPopulationDatasに反映
          prefPopulationDatas[pref.prefCode] = {
            prefName: pref.prefName,
            prefCode: pref.prefCode,
            data: populationData,
          };

          // 47都道府県すべてのデータが揃ったら、resolve()で返す
          let prefCount = prefPopulationDatas.filter((pref) => {
            return !!pref && !!pref.data;
          }).length;
          if (prefCount === prefs.length) {
            // 返す
            resolve(prefPopulationDatas);
          }
        } else {
          if (confirm('RESAS APIから情報を取得できません。ページをリロードしますか？(DL_E2_2)')) {
            location.reload();
          }
          resolve([]);
        }
      });
    } catch (e) {
      if (confirm('RESAS APIのサーバーに接続できません。ページをリロードしますか？(DL_E1_2)')) {
        location.reload();
      }
      resolve([]);
    }
  });
};
export default {
  getPrefs,
  getPrefsPopulation,
};
