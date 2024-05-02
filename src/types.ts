// 型定義
// 都道府県（都道府県名、都道府県コード）
export type prefecture = {
  prefCode: number; // 都道府県コード
  prefName: string; // 都道府県名
};
// 年ごとの値
export type yearValue = {
  year: number; // 年
  value: number; // 値
};
// 人口構成のデータ
export type prefPopulationData = {
  prefCode: number; // 都道府県コード
  prefName: string; // 都道府県名
  data: {
    all: yearValue[]; // 総人口
    child: yearValue[]; // 年少人口
    working: yearValue[]; // 生産年齢人口
    old: yearValue[]; // 老年人口
  };
};
// 人口構成APIのレスポンス（RESAS API準拠）
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
