import {Options} from "selenium-webdriver/firefox";
import {Browser, Builder} from "selenium-webdriver";
import {DiscordUser} from "./discordUser";
import {Driver as FirefoxDriver} from "selenium-webdriver/firefox";

export async function runBrowserAndLogin() {
    const firefoxOptions = new Options()
    const isHeadless: boolean = JSON.parse(process.env.TEST_ENVIRONMENT_IS_HEADLESS)
    if (isHeadless) {
        firefoxOptions.addArguments('--headless')
    }
    const driver = await new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(firefoxOptions).build() as FirefoxDriver;
    const user = new DiscordUser(process.env.TEST_ENVIRONMENT_DISCORD_EMAIL, process.env.TEST_ENVIRONMENT_DISCORD_PASSWORD)

    await user.login(driver, `https://discord.com/channels/${process.env.TEST_ENVIRONMENT_DISCORD_CHAT_GUILD_ID}/${process.env.TEST_ENVIRONMENT_DISCORD_CHAT_CHANNEL_ID}`)
    await driver.sleep(2000)
    return {driver, user}
}