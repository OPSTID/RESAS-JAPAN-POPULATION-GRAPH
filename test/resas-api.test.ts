import { expect, test, vi } from 'vitest';
import { getPrefs, getPrefsPopulation } from '../src/resas-api';

// eslint-disable-next-line no-undef
const global = globalThis;

// テストケース DL_S1, DL_S2は実際にRESAS APIにアクセスして行う

// テストケース DL_S1
// getPrefs()の実行結果の配列のアイテム数が47個（＝都道府県数）に一致することを確認
test('都道府県の取得結果が47件になる(DL_S1)', async () => {
  expect((await getPrefs()).length).toBe(47);
});

test('都道府県の取得結果の最初のアイテムは"北海道"である(DL_S1)', async () => {
  expect((await getPrefs())[0].prefName).toBe('北海道');
});

// テストケース DL_S2
// getPrefsPopulationの配列のアイテム数が48個（＝都道府県数＋(indexを都道府県コードにしているため、空の[0])=48）
test('都道府県別の人口データの取得結果が48件になる(DL_S2)', async () => {
  expect((await getPrefsPopulation(await getPrefs())).length).toBe(48);
});

// テストケース DL_E1_*
// getPrefs, getPrefsPopulation のこのテストケースのときの動作は同じなので、getPrefsのみで確認
test('RESAS APIに接続できないとき、[]を返す(DL_E1_*)', async () => {
  // 通信エラー時、fetchはTypeErrorを発生するのでそれをmockする
  const spy = vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Mock Error'));
  // window.confirmで[キャンセル]ボタンが押されたことをmockする
  global.confirm = () => false;

  expect((await getPrefs()).length).toBe(0);

  spy.mockRestore();
});

// テストケース DL_E2_*
// getPrefs, getPrefsPopulation のこのテストケースのときの動作は同じなので、getPrefsのみで確認
test('RESAS APIでエラーが発生したとき、[]を返す(DL_E2_*)', async () => {
  // 通信エラー時、fetchはTypeErrorを発生するのでそれをmockする
  const spy = vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response('', {
      status: 429,
    })
  );
  // window.confirmで[キャンセル]ボタンが押されたことをmockする
  global.confirm = () => false;

  expect((await getPrefs()).length).toBe(0);

  spy.mockRestore();
});
