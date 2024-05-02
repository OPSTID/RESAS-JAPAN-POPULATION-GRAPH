// 型定義
// 都道府県（都道府県名、都道府県コード）
export type prefecture = {
  prefCode: number;
  prefName: string;
};
// 年ごとの値
export type yearValue = {
  year: number;
  value: number;
};
// 人口構成のデータ
export type prefPopulationData = {
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
export type prefPopulationAPIResponse = {
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
