const {lyricsFinder} = require("../main");
const {Permissions} = require("discord.js");

module.exports.help = {
    name: "lyrics",
    arguments: "(название песни)",
    description: "Поиск текста песни, берёт тексты из Google.",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message,args) => {
    let user_input = ""
    args.forEach((value) => {user_input += value+" "})
    let text = await lyricsFinder("",user_input) || "Ничего не найдено!"
    await message.author.send(text);
};
