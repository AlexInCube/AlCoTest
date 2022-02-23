const Discord = require("discord.js");
const fs = require("fs");
const {getCurrentTimestamp , CheckAllNecessaryPermission} = require("../tools");
const path = require("path");
const config = require("config");
const prefix = config.get('BOT_PREFIX');


module.exports.CommandsSetup = (client) => {
    client.commands = new Discord.Collection() // создаём коллекцию для команд

    const commandsPath = path.resolve('commands')
    //Находим имена команд (имя файла.js) и собираем их в коллекцию.
    fs.readdir(commandsPath, (err, files) => { // чтение файлов в папке commands
        if (err) {console.log(getCurrentTimestamp()+err); return}

        let jsfile = files.filter(f => f.split('.').pop() === 'js') // файлы не имеющие расширение .js игнорируются
        if (jsfile.length <= 0) return console.log(getCurrentTimestamp()+'Команды не найдены!') // если нет ни одного файла с расширением .js

        console.log(getCurrentTimestamp()+`Загружено ${jsfile.length} команд`)
        jsfile.forEach((f) => { // добавляем каждый файл в коллекцию команд
            let props = require(`${commandsPath}/${f}`)
            client.commands.set(props.help.name, props)
        })
    })

    client.on("messageCreate", function(message) {
        if (message.author.bot) return;//Если автор сообщения бот, тогда не обрабатываем его.
        if (!message.content.startsWith(prefix)) return;//Проверка префикса сообщения

        const commandBody = message.content.slice(prefix.length);
        let args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        if (!args) {args = []}

        let command_file = client.commands.get(command) // получение команды из коллекции
        try {
            if (command_file){
                if (!CheckAllNecessaryPermission(client, message, command_file.help.bot_permissions)){return}
                command_file.run(client, message, args)
            } else {
                message.reply("Команды не существует")
            }
        }catch (e) {
            console.log(`${e.stack}`.slice(0,2000))
        }
    });
}

module.exports.prefix = prefix