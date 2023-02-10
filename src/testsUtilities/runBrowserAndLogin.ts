import {Options} from "selenium-webdriver/firefox";
import {Browser, Builder, By, Key} from "selenium-webdriver";
import {Driver as FirefoxDriver} from "selenium-webdriver/firefox";

export async function runBrowserAndLogin() {
    const firefoxOptions = new Options()
    const isHeadless: boolean = JSON.parse(process.env.TEST_ENVIRONMENT_IS_HEADLESS)
    if (isHeadless) {
        firefoxOptions.addArguments('--headless')
    }
    const driver = await new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(firefoxOptions).build() as FirefoxDriver;

    await driver.sleep(100)
    await driver.get(`https://discord.com/channels/${process.env.TEST_ENVIRONMENT_DISCORD_CHAT_GUILD_ID}/${process.env.TEST_ENVIRONMENT_DISCORD_CHAT_CHANNEL_ID}`)
    await driver.sleep(800)
    await driver.findElement(By.className('marginTop8-24uXGp marginCenterHorz-574Oxy linkButton-2ax8wP button-f2h6uQ lookLink-15mFoz lowSaturationUnderline-Z6CW6z colorLink-1Md3RZ sizeMin-DfpWCE grow-2sR_-F'))
        .click()

    const emailField = driver.findElement(By.name('email'))
    const passwordField = driver.findElement(By.name('password'))
    await emailField.sendKeys(process.env.TEST_ENVIRONMENT_DISCORD_EMAIL)
    await passwordField.sendKeys(process.env.TEST_ENVIRONMENT_DISCORD_PASSWORD)
    await passwordField.sendKeys(Key.ENTER)
    await driver.sleep(200)

    return driver
}
