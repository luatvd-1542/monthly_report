import { Page, launch } from "puppeteer";
const fs = require("fs");
import {
  waitForSelectAndType,
  waitForXPathAndClick,
} from "./puppeteer-extensions";

export default class BatchGetData {
  private readonly EMAIL_INPUT_SELECTOR = "#login_email";
  private readonly PWD_INPUT_SELECTOR = "#login_password";
  private readonly LOGIN_BTN_XPATH = '//*[@id="login_submit"]';
  private readonly PATCH_COOKIE = "cookies.json";

  async getData(): Promise<void> {
    const browser = await launch({
      headless: false,
    });
    const page = await browser.newPage();
    const getCookie = await this.getCookie(page);
    if (!getCookie) {
      await page.waitForTimeout(5000);
      await page.goto("https://login.newrelic.com", {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(5000);
      // input email
      await waitForSelectAndType(
        page,
        this.EMAIL_INPUT_SELECTOR,
        "vu.duy.luat@sun-asterisk.com"
      );
      await page.waitForTimeout(2000);
      await waitForXPathAndClick(page, this.LOGIN_BTN_XPATH);
      await page.waitForTimeout(5000);
      // input password
      await waitForSelectAndType(
        page,
        this.PWD_INPUT_SELECTOR,
        "123456@aA123456@aA"
      );
      await page.waitForTimeout(2000);
      await waitForXPathAndClick(page, this.LOGIN_BTN_XPATH);
      await page.waitForTimeout(5000);

      await this.setCookie(page);
    }
    await page.goto("https://one.newrelic.com/launcher/admin-portal.launcher", {
      waitUntil: "domcontentloaded",
    });
  }

  private async setCookie(page: Page): Promise<void> {
    const cookiesObject = await page.cookies();
    // Write cookies to temp file to be used in other profile pages
    fs.writeFile(
      this.PATCH_COOKIE,
      JSON.stringify(cookiesObject),
      function (err) {
        if (err) {
          console.log("The file could not be written.", err);
        }
        console.log("Session has been successfully saved");
      }
    );
  }

  private async getCookie(page: Page): Promise<boolean> {
    const previousSession = fs.existsSync(this.PATCH_COOKIE);

    if (previousSession) {
      // If file exist load the cookies
      const cookiesString = fs.readFileSync(this.PATCH_COOKIE);
      const parsedCookies = JSON.parse(cookiesString);

      if (parsedCookies.length !== 0) {
        for (let cookie of parsedCookies) {
          await page.setCookie(cookie);
        }
        console.log("Session has been loaded in the browser");
        return true;
      }
    }

    return false;
  }
}
