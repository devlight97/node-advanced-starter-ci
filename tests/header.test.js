const CustomPage = require('./helpers/CustomPage');

let page;

beforeEach(async () => {
  page = await CustomPage.build();

  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.closeWindow();
});

test('The header has the correct text', async () => {
  const text = await page.getContentOf('a.brand-logo');
  expect(text).toEqual('Blogster');
});

test('Login with Google feature', async () => {
  await page.click('a[href="/auth/google"]');
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

test('When sign in, shows Logout button', async () => {
  await page.testUserLogin();
  const textLogoutButton = await page.getContentOf('a[href="/auth/logout"]');
  expect(textLogoutButton).toEqual('Logout');
  await page.deleteTestUser();
});
