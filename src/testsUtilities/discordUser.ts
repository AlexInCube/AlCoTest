import {By, Key, WebDriver} from "selenium-webdriver";

export class DiscordUser{
    email: string;
    password: string;
    constructor  (email: string, password: string){
        this.email = email
        this.password = password
    }

    async login(driver: WebDriver, redirectUrl: string) {
        await driver.sleep(100)
        await driver.get(redirectUrl)
        await driver.sleep(2000)
        await driver.findElement(By.className('marginTop8-24uXGp marginCenterHorz-574Oxy linkButton-2ax8wP button-f2h6uQ lookLink-15mFoz lowSaturationUnderline-Z6CW6z colorLink-1Md3RZ sizeMin-DfpWCE grow-2sR_-F'))
            .click()

        await driver.findElement(By.name('email')).sendKeys(this.email)
        await driver.findElement(By.name('password')).sendKeys(this.password)
        await driver.findElement(By.name('password')).sendKeys(Key.ENTER)
        await driver.sleep(200)
    }

    async sendMessage(driver: WebDriver, msg: string) {
        const className = 'markup-eYLPri editor-H2NA06 slateTextArea-27tjG0 fontSize16Padding-XoMpjI'
        await driver.findElement(By.className(className)).sendKeys(msg)
        await driver.findElement(By.className(className)).sendKeys(Key.ENTER)
        await driver.sleep(1000)
    }

    async getLastMessageInChannel(driver: WebDriver){
        const cssSelector = '.messageListItem-ZZ7v6g:last-of-type > .message-2CShn3 > .contents-2MsGLg > .markup-eYLPri'
        return await driver.findElement(By.css(cssSelector)).getText()
    }
}