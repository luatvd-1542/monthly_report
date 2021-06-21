### Mở đầu 
`Puppeteer` là một thư viện dùng để crawl dữ liệu mạnh mẽ cho phép chúng ta dễ dàng 

- Chụp ảnh và file PDF của trang web
- Crawl dữ liệu trang web
- Tự động submit form, testing UI, input bàn phím
- Automated testing trực tiếp trên phiên bản mới nhất của Chrome
- Phân tích vấn đề hiệu năng
- Test Chrome extension

### Nội dung
**1 . Cài đặt** 

- `yarn install` môi trường hoạt động 
- `yarn add puppeteer --save`  cài đặt thư viện puppeteer

**2 . Dùng puppeteer vào zingmp3**

Ta thực hiện dưới đoạn code như sau 

```ts
import { Browser, Page, launch } from "puppeteer"; // nhúng puppeteer
(async () => {
    const browser = await launch({
        headless: false, // tùy chon True sẽ không hiển thị và chạy trên trình duyệt
        defaultViewport: { width: 1366, height: 768 }, 
    });
    const page = await browser.newPage(); // khởi tạo 
    await page.goto("https://zingmp3.vn/zing-chart", {waitUntil: "domcontentloaded"}); //chuyển hướng tới trang web đích 
    await page.waitForTimeout(20000); // thời gian chờ để xử lý
    await browser.close();
})();


```
Tiếp theo chạy lệnh dưới trên terminal

`npx ts-node index.ts`

kết quả nhận được 1 ứng dụng chorme bật lên và zingmp3

![](image/zingmp3.png)

**3 . Truy xuất và lưu dữ liệu** 
- Thực hiện phân tích dữ liệu 
![](image/listSong.png)

 Ở đây ta thấy việc dữ liệu đươc liệt kê cụ thể và đồng nhất vào các khối. Ta lần lượt truy cập vào từng vị trí để lấy dữ liệu
 
- Thực hiện truy xuất dữ liệu
```js
import { Browser, Page, launch } from "puppeteer";
(async () => {
    const browser = await launch({
        headless: false,
    });
    const page = await browser.newPage();
    await page.goto("https://zingmp3.vn/zing-chart", {waitUntil: "domcontentloaded"});
    //close advertisement
    const ADXpath = '//*[@id="adtimapopup-closebutton"]';
    const ADElements = await page.$x(ADXpath);
    if (ADElements.length) {
        await ADElements[0].click();
    }
    await page.waitForTimeout(2000);

    //click load more get 100 songs
    const btnLoadMoreXpath = '//*[@id="body-scroll"]/div[1]/div[1]/div[4]/button';
    await page.waitForXPath(btnLoadMoreXpath);
    await (await page.$x(btnLoadMoreXpath))[0].click();
    await page.waitForTimeout(10000);
    
    //get array songs
    const arraySong = Array.from(
      await page.$$(
        '.chart-song-item',
      ),
    );
    let arrayIndex = 1;
    for (const song of arraySong) {
        //thumb url
        const thumbElement = (await song.$x(`//*[@id="body-scroll"]/div[1]/div[1]/div[3]/div[${arrayIndex}]/div/div/div[1]/div[2]/figure/img`))[0];
        const thumb = await (await thumbElement.getProperty("src")).jsonValue<string>();

        //name song
        const nameElement = (await song.$x(`//*[@id="body-scroll"]/div[1]/div[1]/div[3]/div[${arrayIndex}]/div/div/div[1]/div[3]/div/span`))[0];
        const name = await (await nameElement.getProperty("textContent")).jsonValue<string>();

        console.log(thumb, name);
        arrayIndex++;
    }
    console.log(arraySong.length);
    await page.waitForTimeout(20000);
    await browser.close();
})();
```
- Kết quả
![](image/resultZing.png)


- Lưu kết quả crawl được vào file
```js
import { Browser, Page, launch } from "puppeteer";
const fs = require('fs');
(async () => {
    const browser = await launch({
        headless: false,
    });
    const page = await browser.newPage();
    await page.goto("https://zingmp3.vn/zing-chart", {waitUntil: "domcontentloaded"});
    //close advertisement
    const ADXpath = '//*[@id="adtimapopup-closebutton"]';
    const ADElements = await page.$x(ADXpath);
    if (ADElements.length) {
        await ADElements[0].click();
    }
    await page.waitForTimeout(2000);

    //click load more get 100 songs
    const btnLoadMoreXpath = '//*[@id="body-scroll"]/div[1]/div[1]/div[4]/button';
    await page.waitForXPath(btnLoadMoreXpath);
    await (await page.$x(btnLoadMoreXpath))[0].click();
    await page.waitForTimeout(10000);

    //get array songs
    const arraySong = Array.from(
      await page.$$(
        '.chart-song-item',
      ),
    );
    let arrayIndex = 1;
    let listSong = [];

    for (const song of arraySong) {
        //thumb url
        const thumbElement = (await song.$x(`//*[@id="body-scroll"]/div[1]/div[1]/div[3]/div[${arrayIndex}]/div/div/div[1]/div[2]/figure/img`))[0];
        const thumb = await (await thumbElement.getProperty("src")).jsonValue<string>();

        //name song
        const nameElement = (await song.$x(`//*[@id="body-scroll"]/div[1]/div[1]/div[3]/div[${arrayIndex}]/div/div/div[1]/div[3]/div/span`))[0];
        const name = await (await nameElement.getProperty("textContent")).jsonValue<string>();

        listSong.push({name, thumb});
        arrayIndex++;
    }
    await fs.writeFileSync('list_song.json', JSON.stringify(listSong));
    await page.waitForTimeout(20000);
    await browser.close();
})();

```

- Kết quả 

![](image/fileZing.png)

### Kết luận
- Qua việc sử dụng thư viện trên chúng ta có thể linh hoạt tổng hợp về kho của chúng ta

### Tài liệu 
https://www.npmjs.com/package/puppeteer
