const {getVoiceConnection} = require("@discordjs/voice");
const {GuildMember} = require("discord.js");

function getCurrentTimestamp(){
    let today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();
    const hour = today.getHours()
    const minute = today.getMinutes()
    const seconds = today.getSeconds()

    today = dd + '/' + mm + '/' + yyyy + ' | ' + hour + ':' + minute + ':' + seconds;
    return `[ ${today.toString()} ] `
}

function isUserConnectedToSameVoice(message,button){
    let connection = getVoiceConnection(message.guildId)

    if(!connection) return false
    if(connection.joinConfig.channelId === button.member.voice.channelId) {
        return true
    }else{
        return false
    }
}

module.exports = { getCurrentTimestamp , isUserConnectedToSameVoice};