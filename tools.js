const {getVoiceConnection} = require("@discordjs/voice");

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
    return connection.joinConfig.channelId === button.member.voice.channelId;
}

function isValidURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

function ClearUsedIDFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith('<@&') && mention.endsWith('>')) {
        mention = mention.slice(3, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }

        return mention;
    }
}

module.exports = { getCurrentTimestamp , isUserConnectedToSameVoice, isValidURL, ClearUsedIDFromMention};