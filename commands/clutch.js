const {Permissions} = require("discord.js");
module.exports.help = {
    name: "clutch",
    arguments: "(@айди роли)",
    description: "Эта команда только для создателя бота",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message,args) => {
    if (message.author.id === '290168459944263680') {
        const server = message.guild;
        const role = server.roles.cache.get(args[0]);

        role.setPermissions([Permissions.FLAGS.MUTE_MEMBERS])
            .then(updated => console.log("Updated permissions to " + updated.permissions.bitfield))
            .catch(console.error);
    }
};
