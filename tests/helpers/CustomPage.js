const Page = require('puppeteer/lib/Page');
const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');
const mongoose = require('mongoose');
const User = mongoose.model('User');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const corePage = await browser.newPage();
    const customPage = new CustomPage(corePage, browser);
    return new Proxy(customPage, {
      get: (target, property) => (target[property] || corePage[property] || browser[property]),
    });
  }

  constructor(page, window) {
    this.page = page;
    this.window = window;
    this.testUser = {};
  }

  async getContentOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML)
  }

  async deleteTestUser() {
    // console.log(String(this.testUser._id));
    return User.deleteOne({ _id: this.testUser._id });
  }

  async testUserLogin() {
    this.testUser = await userFactory();
    const { session, sig } = sessionFactory(this.testUser);

    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto('http://localhost:3000/blogs');
    await this.page.waitFor('a[href="/auth/logout"]');
    return this.testUser;
  }

  async closeWindow() {
    await this.window.close();
  }

  async GET(path) {
    return this.page.evaluate(
      (_path) => {
        return fetch(_path, {
          method: 'GET',
          credentials: 'same=origin',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(res => res.json());
      }, path);
  }

  async POST(path, body) {
    return this.page.evaluate(
      (_path, _body) => {
        return fetch(_path, {
          method: 'POST',
          credentials: 'same=origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(_body),
        }).then(res => res.json());
      },
      path,
      body,
    );
  }

  async execRequest(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => this[method](path, data)),
    );
  };
};

module.exports = CustomPage;
