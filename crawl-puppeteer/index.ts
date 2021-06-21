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
