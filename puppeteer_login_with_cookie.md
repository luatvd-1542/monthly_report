### Mở đầu 
Việc tổng hợp dữ liệu từ các trang web khác nhiều lúc chúng ta vấp phải những rào cản. Ví dụ trang web đó yêu cầu đăng nhập...v..v
Chúng ta sẽ phải mô phỏng tất cả các bước. Bài này chúng ta sẽ làm bước đăng nhập và lưu lại ghi nhớ đăng nhập

### Nội dung
- **Chuẩn bị khung sườn** 
```js

import { Page, launch } from "puppeteer";
export default class BatchGetData { 
    async getData() {
        const browser = await launch({
            headless: false, //option show UI 
        });
        const page = await browser.newPage();
    }
}
```

Và một file main.ts để chạy nhiều function, chức năng 

`main.js`

```js
import BatchGetData from "./batch_get_data";
const test = new BatchGetData();
test.getData();
```

giờ hãy thử chạy lệnh `npx ts-node main.ts` kết quả sẽ là một tab chrome được bật lên.
- **Chuyển hướng đến trang login**
```js
import { Page, launch } from "puppeteer";
export default class BatchGetData { 
    async getData() {
        const browser = await launch({
            headless: false, //option show UI 
        });
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(false); // không tải javaScript 
        await page.goto("https://login.newrelic.com", {
            waitUntil: "domcontentloaded", // chờ cho đến khi load xong domcontent
            timeout: 30000 // thời gian chờ
      });
    }
}
```
Có những trang web hiện nay sử dụng quá nhiều javaScript khiến trang web đó nặng hơn, load lâu hơn đối với chúng ta. 

Nếu 
javaScript không cần thiết chúng ta có thể bỏ để giảm tải thời gian xử lý. Hãy thử từng page 1 xem chúng ta loại bỏ được ở những page nào.

- Nhập thông tin đăng nhập

```js
import { Page, launch } from "puppeteer";
import {
  waitForSelectAndType,
  waitForXPathAndClick,
} from "./puppeteer-extensions";

export default class BatchGetData { 
    private readonly EMAIL_INPUT_SELECTOR = "#login_email";
    private readonly PWD_INPUT_SELECTOR = "#login_password";
    private readonly LOGIN_BTN_XPATH = '//*[@id="login_submit"]';

    async getData() {
        const browser = await launch({
            headless: false, //option show UI 
        });
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(false); // không tải javaScript 
        await page.goto("https://login.newrelic.com", {
            waitUntil: "domcontentloaded", // chờ cho đến khi load xong domcontent
            timeout: 30000 // thời gian chờ
      });
      // input email
      await waitForSelectAndType(
        page,
        this.EMAIL_INPUT_SELECTOR,
        "example@email.com"
      );
      await waitForXPathAndClick(page, this.LOGIN_BTN_XPATH);
      await page.waitForTimeout(5000);

      // input password
      await waitForSelectAndType(
        page,
        this.PWD_INPUT_SELECTOR,
        "123456@aA123456@aA"
      );
      await waitForXPathAndClick(page, this.LOGIN_BTN_XPATH);
      await page.waitForTimeout(5000);
    }
}
```
Tạo thêm một file helper để viết các function chung 

`puppeteer-extensions.ts`
```js
import { ElementHandle, Page, Frame } from "puppeteer";

export async function waitForXPathAndClick(
  page: Frame | Page,
  xPath: string
): Promise<void> {
  await (await waitAndGetFirstXPath(page, xPath)).click();
}

export async function waitAndGetFirstXPath(
  page: Frame | Page,
  xPath: string
): Promise<ElementHandle> {
  await page.waitForXPath(xPath);
  return (await page.$x(xPath))[0];
}

export async function waitForSelectAndType(
  page: Frame | Page,
  selector: string,
  value: string
): Promise<void> {
  await page.waitForSelector(selector);
  return await page.type(selector, value);
}
```
Tùy thuộc vào page đó chúng ta lấy selector dễ và cố định không. Chúng ta cố gắng chọn selector sao cho sự thay đổi theo
service đó là ít nhất. 

Nguyên lý hoạt động ta sẽ focus đến element đó rồi thao tác điền email, password, click button login.

Sau những bước trên ta đã mô phỏng được quá trình đăng nhập như ta thao tác thủ công bằng tay. Tiếp theo ta xử lý phần ghi nhớ đăng nhập

- **Ghi nhớ đăng nhập** 

Ta sử dụng cookie để làm việc này
Sau khi đăng nhập ta tiến hành lưu lại cookie vào file json, lần tiếp theo vào ta check xem có tồn tại cookie hay không, nếu có thì 
set lại cho page đó.

Ở file `puppeteer-extensions.ts` ta thêm 2 function sau

```js
export async function setCookie(page: Page): Promise<void> {
  const cookiesObject = await page.cookies();
  // Write cookies to temp file to be used in other profile pages
  fs.writeFile(PATCH_COOKIE, JSON.stringify(cookiesObject), function (err) {
    if (err) {
      console.log("The file could not be written.", err);
    }
    console.log("Session has been successfully saved");
  });
}

export async function getCookie(page: Page): Promise<boolean> {
  const previousSession = fs.existsSync('cookie.json');

  if (previousSession) {
    // If file exist load the cookies
    const cookiesString = fs.readFileSync(PATCH_COOKIE);
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
```

file `batch_get_data.ts`
```js
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
      await page.goto("https://login.newrelic.com", {
        waitUntil: "domcontentloaded",
      });
      // input email
      await waitForSelectAndType(
        page,
        this.EMAIL_INPUT_SELECTOR,
        "example@email.com"
      );
      await waitForXPathAndClick(page, this.LOGIN_BTN_XPATH);
      await page.waitForTimeout(5000);

      // input password
      await waitForSelectAndType(
        page,
        this.PWD_INPUT_SELECTOR,
        "123456@aA123456@aA"
      );
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

```
Giờ chúng ta chạy xem thành quả như nào !!!

Chúc bạn thành công!
