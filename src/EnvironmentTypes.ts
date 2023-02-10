export {};// я не знаю зачем это, но без этого нельзя объявить глобальный модуль

declare global{
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv {
            BOT_COMMAND_PREFIX: string,
            BOT_DISCORD_TOKEN: string,
            BOT_DISCORD_CLIENT_ID: string,
            BOT_DISCORD_CLIENT_SECRET: string,
            TEST_ENVIRONMENT_DISCORD_TEST_BOT_TOKEN: string,
            TEST_ENVIRONMENT_DISCORD_EMAIL: string,
            TEST_ENVIRONMENT_DISCORD_PASSWORD: string,
            TEST_ENVIRONMENT_IS_HEADLESS: string
            TEST_ENVIRONMENT_DISCORD_CHAT_GUILD_ID: string;
            TEST_ENVIRONMENT_DISCORD_CHAT_CHANNEL_ID: string;
        }
    }
}
