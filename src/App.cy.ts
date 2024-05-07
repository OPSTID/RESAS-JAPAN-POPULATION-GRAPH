import App from './App.vue';

describe('<App />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-vue
    // @ts-ignore
    cy.mount(App);

    // DL_Sのテスト
    // RESAS APIからのデータのダウンロードが完了するまで待つ（5秒）
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);

    // ページの1つめの<label>が北海道であることを確認する
    cy.get('label').first().should('contain', '北海道');
    // 47都道府県が正しく取得できていること=checkboxが47個あることを確認する
    cy.get("input[type='checkbox']").its('length').should('eq', 47);
  });
});
