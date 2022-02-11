const CustomPage = require('./helpers/CustomPage');

let page;

beforeEach(async () => {
  page = await CustomPage.build();
  await page.goto('localhost:3000');
});

afterEach(async () => {
  await page.closeWindow();
});

describe('When logged in', async () => {
  beforeEach(async () => {
    await page.testUserLogin();
  });

  afterEach(async () => {
    await page.deleteTestUser();
  });

  test('Click button creating, show creating form', async () => {
    await page.click('a[href="/blogs/new"]');
    const blogTitleEl = await page.getContentOf('form label');
    expect(blogTitleEl).toEqual('Blog Title');
  });

  describe('And using invalid inputs', async () => {
    beforeEach(async () => {
      await page.goto('localhost:3000/blogs/new');
      await page.click('button[type="submit"]');
    });
    test('the form shows an error message', async () => {
      const titleErr = await page.getContentOf('.title .red-text');
      const contentErr = await page.getContentOf('.content .red-text');

      expect(titleErr).toEqual('You must provide a value');
      expect(contentErr).toEqual('You must provide a value');
    });
  });

  describe('And using valid inputs', async () => {
    beforeEach(async () => {

      // filling input
      await page.goto('localhost:3000/blogs/new');
      await page.type('.title input', 'My Title');
      await page.type('.content input', 'My Content');
      await page.click('button[type="submit"]');
    });

    test('taking review screen when submit successful', async () => {
      const confirmTitle = await page.getContentOf('form h5');
      expect(confirmTitle).toEqual('Please confirm your entries');
    });

    test('Submitting then add blog to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');

      const title = await page.getContentOf('.card-title');
      const content = await page.getContentOf('p');

      expect(title).toEqual('My Title');
      expect(content).toEqual('My Content');
    });
  });
});

describe('User is not logged in', async () => {
  test('User can not create a new blog', async () => {
    const createBlogResponse = await page.POST(
      '/api/blogs',
      { title: 'My Title', content: 'My Content' },
    );
    expect(createBlogResponse.error).toEqual('You must log in!');
  });

  test('User can not get blog list', async () => {
    const getBlogsResponse = await page.GET('/api/blogs');
    expect(getBlogsResponse.error).toEqual('You must log in!');
  });

  test('Can not use blog api when is not logged in', async () => {
    const actions = [
      {
        method: 'GET',
        path: '/api/blogs',
      },
      {
        method: 'GET',
        path: '/api/blogs/123123123',
      },
      {
        method: 'POST',
        path: '/api/blogs',
        data: { title: 'My Title', content: 'My Content' },
      },
    ];

    const responses = await page.execRequest(actions);
    responses.forEach(res => expect(res.error).toEqual('You must log in!'));
  })
});
