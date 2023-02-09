import {DiscordUser} from "../src/testsUtilities/discordUser";
import alcotest from "../src/commands/fun/alcotest.command";
import '../src/EnvironmentTypes'
import {runBrowserAndLogin} from "../src/testsUtilities/runBrowserAndLogin";
import {loggerSend} from "../src/utilities/logger"
import {Driver} from "selenium-webdriver/firefox";
import inviteLinkCommand from "../src/commands/other/inviteLink.command";
import {generateLinkMessage} from "../src/commands/other/inviteLink.command";

let driver: Driver;
let user: DiscordUser;

beforeAll(async () => {
    await runBrowserAndLogin().then((r) => {
        driver = r.driver
        user = r.user
    })
})

afterAll(async () => {
    try {
        await driver.quit()
    } catch (e) {
        loggerSend(e)
    }
})

describe('commandsAll', () => {
    beforeEach(async () => {
        return await driver.sleep(2000)
    })

    test(`${alcotest.name}`, async () => {
        await user.sendMessage(driver, `${process.env.BOT_COMMAND_PREFIX}${alcotest.name}`)
        await user.getLastMessageInChannel(driver).then((messageContent: string) => {
            const isStarts: boolean = messageContent.startsWith("Вы состоите из пива на ")
            expect(isStarts).toBe(true);
        })
    })

    test(`${inviteLinkCommand.name}`, async () => {
        await user.sendMessage(driver, `${process.env.BOT_COMMAND_PREFIX}${inviteLinkCommand.name}`)
        await user.getLastMessageInChannel(driver).then((messageContent: string) => {
            const isTheSameLink: boolean = messageContent === generateLinkMessage()
            expect(isTheSameLink).toBe(true);
        })
    })
});

