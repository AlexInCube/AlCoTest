import {By, Key, WebDriver} from "selenium-webdriver";
import {Client, GatewayIntentBits, Message, TextChannel} from "discord.js";

export class DiscordBotTestingUnit {
    driver: WebDriver;
    testingBot!: Client;
    guildId: string;
    channelId: string;

    constructor(driver: WebDriver) {
        this.driver = driver
        this.guildId = process.env.TEST_ENVIRONMENT_DISCORD_CHAT_GUILD_ID
        this.channelId = process.env.TEST_ENVIRONMENT_DISCORD_CHAT_CHANNEL_ID
    }

    private textBoxSelector = 'markup-eYLPri editor-H2NA06 slateTextArea-27tjG0 fontSize16Padding-XoMpjI'

    async runTestSuite(){
        this.testingBot = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageTyping
            ],
        })

        void this.testingBot.login(process.env.TEST_ENVIRONMENT_DISCORD_TEST_BOT_TOKEN);
        await this.driver.sleep(10000)
    }
    async writeInMessageTextBox(text: string) {
        await this.driver.findElement(By.className(this.textBoxSelector)).sendKeys(text)
        await this.driver.sleep(100)
    }
    async sendMessage(msg: string) {
        await this.writeInMessageTextBox(msg)
        await this.driver.findElement(By.className(this.textBoxSelector)).sendKeys(Key.ENTER)
        await this.driver.sleep(1500)
    }

    async sendSlashCommand(msg: string) {
        await this.writeInMessageTextBox("/")
        await this.driver.findElement(By.className(this.textBoxSelector)).sendKeys(msg)
        await this.driver.findElement(By.className(this.textBoxSelector)).sendKeys(Key.ENTER)
        await this.driver.sleep(500)
        await this.driver.findElement(By.className(this.textBoxSelector)).sendKeys(Key.ENTER)
        await this.driver.sleep(500)
        await this.driver.findElement(By.className(this.textBoxSelector)).sendKeys(Key.ENTER)
        await this.driver.sleep(1500)
    }

    async getLastMessageInChannel(): Promise<Message | undefined>{
        const channel: TextChannel = this.testingBot.channels.cache.get(this.channelId) as TextChannel

        if (!channel) return undefined

        const messagesCollection = await channel.messages.fetch({ limit: 1 })

        return messagesCollection.first() as Message


        //const messageContentSelector = this.lastMessageSelector + ' > .contents-2MsGLg > .markup-eYLPri'
        //return await this.driver.findElement(By.css(messageContentSelector)).getText()
    }
}

