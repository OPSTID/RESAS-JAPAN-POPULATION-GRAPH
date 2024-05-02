// 型定義
// 都道府県（都道府県名、都道府県コード）
export type Prefecture = {
  prefCode: number; // 都道府県コード
  prefName: string; // 都道府県名
};
// 年ごとの値
export type YearValue = {
  year: number; // 年
  value: number; // 値
};
// 人口構成のデータ
export type PrefPopulationData = {
  prefCode: number; // 都道府県コード
  prefName: string; // 都道府県名
  data: {
    all: YearValue[]; // 総人口
    child: YearValue[]; // 年少人口
    working: YearValue[]; // 生産年齢人口
    old: YearValue[]; // 老年人口
  };
};
// 人口構成APIのレスポンス（RESAS API準拠）
export type PrefPopulationAPIResponse = {
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
