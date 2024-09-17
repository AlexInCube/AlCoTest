import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import { ENV } from './EnvironmentVariables.js';
import { loggerError, loggerSend, loggerWarn } from './utilities/logger.js';

// Need to bypass error "This browser or app may not be secure" after Google form email input
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('iframe.contentWindow');
stealth.enabledEvasions.delete('media.codecs');
puppeteer.use(stealth);

export async function getYoutubeCookie() {
  if (!ENV.BOT_GOOGLE_EMAIL || !ENV.BOT_GOOGLE_PASSWORD) {
    loggerWarn('BOT_GOOGLE_EMAIL or BOT_GOOGLE_PASSWORD is are wrong or not provided');

    return;
  }

  loggerSend('Trying to fetch cookie from Google Auth, this might be take a time');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--remote-debugging-port=9222', '--remote-debugging-address=0.0.0.0', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2' });

  try {
    // Press "Sign In" button on YouTube in accept cookie usage
    await page.click(
      '#topbar > div.top-buttons.style-scope.ytd-consent-bump-v2-lightbox > div:nth-child(2) > ytd-button-renderer > yt-button-shape > a'
    );
  } catch {
    // Press "Sign In" on navbar
    await page.click('#buttons > ytd-button-renderer > yt-button-shape > a');
  }
  // Type Email in form
  await page.waitForSelector('#identifierId', { visible: true });
  await page.type('#identifierId', ENV.BOT_GOOGLE_EMAIL);
  await page.click('#identifierNext');

  // Type Password in form
  await page.waitForSelector('#password', { visible: true });
  await page.type('#password input', ENV.BOT_GOOGLE_PASSWORD);
  // @ts-expect-error Because page.click() on '#passwordNext' is not working. So i use page.evaluate() to workaround
  await page.evaluate((selector) => document.querySelector(selector).click(), '#passwordNext');

  // Skip measures of security (if Google asks)
  try {
    const NotNowSelector =
      '#yDmH0d > c-wiz:nth-child(9) > div > div > div > div.L5MEH.Bokche.ypEC4c > div.lq3Znf > div:nth-child(1) > button > span';
    await page.waitForSelector(NotNowSelector, { timeout: 1e4 });
    await page.click(NotNowSelector);
  } catch {
    await page.goto('https://www.youtube.com', { waitUntil: 'networkidle2' });
  }

  const cookies = await page.cookies();

  await browser.close();

  if (cookies.length < 10) {
    loggerError('Something went wrong during authentication to Google');
    return undefined;
  }

  const cookiesJson = JSON.stringify(cookies, null, 2);
  fs.writeFileSync('yt-cookies.json', cookiesJson);

  //loggerSend(cookiesJson);

  if (!cookies) loggerError('Failed to fetch YouTube cookies');
  if (cookiesJson) loggerSend('YouTube Cookies fetched successfully');

  return cookies;
}

/*
function checkCookiesValid(){
  distube.resolve
}
*/
