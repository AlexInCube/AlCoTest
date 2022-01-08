const {lyricsFinder} = require("../main");

module.exports.help = {
    name: "lyrics"
};

module.exports.run = async (client,message,args) => {
    let text = await lyricsFinder("",args[0]) || "Ничего не найдено!"
    await message.channel.send(text);
};
