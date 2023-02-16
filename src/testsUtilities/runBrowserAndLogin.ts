import {Driver as FirefoxDriver, Options} from "selenium-webdriver/firefox";
import {Browser, Builder, By, Key} from "selenium-webdriver";

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
    await driver.findElement(By.className('marginTop8-24uXGp marginCenterHorz-574Oxy linkButton-2ax8wP button-ejjZWC lookLink-13iF2K lowSaturationUnderline-Z6CW6z colorLink-34zig_ sizeMin-3Yqxk5 grow-2T4nbg'))
        .click()

    const emailField = driver.findElement(By.name('email'))
    const passwordField = driver.findElement(By.name('password'))
    await emailField.sendKeys(process.env.TEST_ENVIRONMENT_DISCORD_EMAIL)
    await passwordField.sendKeys(process.env.TEST_ENVIRONMENT_DISCORD_PASSWORD)
    await passwordField.sendKeys(Key.ENTER)
    await driver.sleep(200)

    return driver
}
