module.exports.help = {
    name: "alcotest"
};

module.exports.run = async (client,message) => {
    message.reply(`🍻 Вы состоите из пива на ${Math.round(Math.random()*100)}% 🍻 `);
};
