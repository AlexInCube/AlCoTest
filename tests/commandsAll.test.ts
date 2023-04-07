import {DiscordBotTestingUnit} from "./testsUtilities/DiscordBotTestingUnit";
import alcotest from "../src/commands/fun/alcotest.command";
import '../src/EnvironmentTypes'
import {runBrowserAndLogin} from "./testsUtilities/runBrowserAndLogin";
import {loggerSend} from "../src/utilities/logger"
import {Driver} from "selenium-webdriver/firefox";
import inviteLinkCommand from "../src/commands/info/inviteLink.command";
import {generateLinkMessage} from "../src/commands/info/inviteLink.command";
import helpCommand from "../src/commands/info/help.command";
import {fail} from "assert";

let driver: Driver;
let testingUnit: DiscordBotTestingUnit;

beforeAll(async () => {
    await runBrowserAndLogin().then((r) => {
        driver = r
    })

    testingUnit = new DiscordBotTestingUnit(driver)
    await testingUnit.runTestSuite()

    await driver.sleep(1000)
})

afterAll(async () => {
    try {
        testingUnit.testingBot.destroy()
        await driver.quit()
    } catch (e) {
        loggerSend(e)
    }
})

describe('commandsAll', () => {
    beforeEach(async () => {
        return await driver.sleep(1000)
    })

    describe(`alcotestCommand`, () => {
        beforeEach(async () => {
            return await driver.sleep(1000)
        })

        test(`text`, async () => {
            await testingUnit.sendMessage(`${process.env.BOT_COMMAND_PREFIX}${alcotest.name}`)
            await testingUnit.getLastMessageInChannel().then((message) => {
                if (!message) fail()
                const isStarts: boolean = message.content.startsWith("🍻 Вы состоите из пива на ")
                expect(isStarts).toBe(true);
            })
        })

        test(`slash`, async () => {
            await testingUnit.sendSlashCommand(`${alcotest.name}`)
            await testingUnit.getLastMessageInChannel().then((message) => {
                if (!message) fail()
                const isStarts: boolean = message.content.startsWith("🍻 Вы состоите из пива на ")
                expect(isStarts).toBe(true);
            })
        })
    })

    describe(`linkCommand`, () => {
        beforeEach(async () => {
            return await driver.sleep(1000)
        })

        test(`text`, async () => {
            await testingUnit.sendMessage(`${process.env.BOT_COMMAND_PREFIX}${inviteLinkCommand.name}`)
            await testingUnit.getLastMessageInChannel().then((message) => {
                if (!message) fail()
                expect(message.content).toEqual(generateLinkMessage())
            })
        })

        test(`slash`, async () => {
            await testingUnit.sendSlashCommand(`${inviteLinkCommand.name}`)
            await testingUnit.getLastMessageInChannel().then((message) => {
                if (!message) fail()
                expect(message.content).toEqual(generateLinkMessage())
            })
        })
    })

    describe(`helpCommand`, () => {
        describe(`text`, () => {
            beforeEach(async () => {
                return await driver.sleep(1000)
            })

            test('without_args', async () => {
                await testingUnit.sendMessage(`${process.env.BOT_COMMAND_PREFIX}${helpCommand.name}`)
                await testingUnit.getLastMessageInChannel().then((message) => {
                    if (!message) fail()
                    expect(message.embeds[0].title).toEqual('Справка о командах')
                })
            })

            test('with_args', async () => {
                await testingUnit.sendMessage(`${process.env.BOT_COMMAND_PREFIX}${helpCommand.name} ${alcotest.name}`)
                await testingUnit.getLastMessageInChannel().then((message) => {
                    if (!message) fail()
                    expect(message.embeds[0].description).toEqual(alcotest.description)
                })
            })
        })
    })
});

