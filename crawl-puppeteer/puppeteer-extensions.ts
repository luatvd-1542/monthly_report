import { ElementHandle, Page, Frame } from "puppeteer";
const fs = require("fs");
const PATCH_COOKIE = "cookies.json";

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

export async function getElementTextContent(
  element: ElementHandle<Element>
): Promise<string> {
  return await (await element.getProperty("textContent")).jsonValue<string>();
}

export async function getElementProperty(
  element: ElementHandle<Element>,
  property: string
): Promise<string> {
  return await (await element.getProperty(property)).jsonValue<string>();
}

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
  const previousSession = fs.existsSync(PATCH_COOKIE);

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
