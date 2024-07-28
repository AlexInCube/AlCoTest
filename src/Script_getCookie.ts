import { getYoutubeCookie } from './CookiesAutomation.js';
import { loggerSend } from './utilities/logger.js';

const cookie = await getYoutubeCookie();

if (cookie) {
  loggerSend('Cookies written in yt-cookies.json');
} else {
  loggerSend('Cookies fetching is failure');
}
