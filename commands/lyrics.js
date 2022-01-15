const {lyricsFinder} = require("../main");

module.exports.help = {
    name: "lyrics",
    arguments: "(название песни)",
    description: "Поиск текста песни, берёт тексты из Google."
};

module.exports.run = async (client,message,args) => {
    let user_input = ""
    args.forEach((value) => {user_input += value})
    let text = await lyricsFinder("",user_input) || "Ничего не найдено!"
    await message.channel.send(text);
};
