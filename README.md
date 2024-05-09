# RESAS-JAPAN-POPULATION-GRAPH

RESAS APIを用いて都道府県別の総人口推移グラフを表示するWebアプリです

## 動作確認をする前に確認いただきたいこと

1. 事前にプロジェクトルートに以下の形式で `.env.local` の作成をお願いします。

   ```
   VITE_RESAS_API_KEY="(RESAS APIキー)"
   ```

2. `npm run dev` でデバッグ環境で実行できます。
3. `npm run test` でテストを実行できます。
4. `npx cypress` でCypressによる動作テストができます。

5. `npm run build` でアプリをビルドできます。

## ディレクトリ構造（抜粋）

* **cypress**
  Cypress の設定関連ファイル
* **docs**
  GitHub Pages で公開する、ビルド済みアプリケーション
* **public**
  * *loading.svg*
    読み込み中アニメーション画像
* **src**
  * **components**
    各コンポーネントの保存場所
  * *App.cy.ts*
    Cypress のテストコード
  * *App.vue*
    アプリメイン画面コンポーネント
  * *main.ts*
    アプリメインスクリプト
  * *resas-api.ts*
    RESAS APIからの情報取得関連のスクリプト
  * *resas-api.test.ts*
    `resas-api.ts` のテストコード
  * *shims.d.ts*
    `.vue` ファイルの型定義ファイル
  * *style.css*
    メインスタイルシート
* *.eslintrc*、*eslint.config.js*
* *.prettierrc.cjs*
* *index.html*
* ...

## テストケース

### データの取得(DL)

「データの取得(DL)」の動作テストはすべて**テストコード** `/test/resas-api.test.ts` によって行うものとする。
また、一部のテストについては、Cypressでのブラウザにおける動作テストも行う。

| テストケースID | 説明                                                         | 前提条件                                                     | テスト手順                                                   | 期待される結果                                               |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| DL_S1          | 都道府県一覧を正常にダウンロードできた。                     | 有効な都道府県一覧をRESAS APIから取得できる。                | `resas-api.ts` 内の `await getPrefs()` が返す配列の数を確認する。また最初の要素の都道府県名を確認する。さらに、Cypressにより、都道府県チェックボックスの数、最初の要素の都道府県名の確認を行う。 | 返り値の`length` が `47` になる。またその最初の要素の都道府県名は`"北海道"` になる。 |
| DL_S2          | 都道府県の人口構成を正常にダウンロードできた。               | 有効な都道府県の人口構成のデータをRESAS APIから取得できる。  | `resas-api.ts` 内の `await getPrefsPopulation(prefs)` が返す配列の数を確認する。 | 返り値の`length` が `48` になる。                            |
| DL_E1_1        | 都道府県一覧をRESAS APIから何らかの理由で取得できなかった。  | RESAS APIの都道府県一覧を取得するAPIに接続できない。         | `fetch()` が `TypeError` となるようなmockを作成し、返り値が空の配列であることを確認する | 返り値の`length` が `0` になる。                             |
| DL_E1_2        | 都道府県の人口構成をRESAS APIから何らかの理由で取得できなかった。 | RESAS APIの都道府県の人口構成を取得するAPIに接続できない。   | 同上。                                                       | （DL_E1_1と同じエラーハンドリングを行っているため、DL_E1_1のテストが正常に完了したらOKとする。） |
| DL_E2_1        | 都道府県一覧をRESAS APIから取得する際、RESAS APIでエラーが発生した(500 エラーなど) | RESAS APIから情報取得時にRESAS APIのサーバー側でエラーが発生する。 | レスポンスが開発中最も発生した、HTTPステータスコード`429`となるような`fetch()` のmockを作成し、返り値が空の配列であることを確認する。 | 返り値の`length` が `0` になる。                             |
| DL_E2_2        | 都道府県の人口構成をRESAS APIから取得する際、RESAS APIでエラーが発生した(500 エラーなど) | RESAS APIから情報取得時にRESAS APIのサーバー側でエラーが発生する。 | 同上。                                                       | （DL_E2_1と同じエラーハンドリングを行っているため、DL_E2_1のテストが正常に完了したらOKとする。） |

### グラフの表示(CH)

「グラフの表示(CH)」に関するテストはすべて**手動（ブラウザでの目視での動作確認）**で行うものとする。

| テストケースID | 説明                                                                                   | 前提条件     | テスト手順                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| CH_S1          | 都道府県を選択すると、その都道府県のグラフが表示される                                 | DL_S1, DL_S2 | 1. ページにアクセスし、都道府県一覧が表示されていることを確認<br>2. 都道府県を選択する                                                                |
| CH_S2          | グラフの種類（総人口、生産年齢人口など）を切り替えたときに、グラフが正しく切り替わる。 | CH_S1        | 1. CH_S1のテスト手順を行い、グラフの表示を確認する。<br>2. グラフ上部にあるグラフの種類切り替えタブをクリックして、表示するグラフの種類を切り替える。 |
