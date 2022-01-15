module.exports.help = {
    name: "alcotest",
    description: "Пишет процент пива в твоей крови"
};

module.exports.run = async (client,message) => {
    message.reply(`🍻 Вы состоите из пива на ${Math.round(Math.random()*100)}% 🍻 `);
};
