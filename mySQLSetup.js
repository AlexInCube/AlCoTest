const {getCurrentTimestamp} = require("./tools");
const mysql = require("mysql2");
const config = require("./config.json");

function mySQLSetup(){
    const connection = mysql.createConnection({
        host: config.DB_IP,
        user: config.DB_USER,
        database: config.DB_DATABASE,
        password: config.DB_PASSWORD
    });

    connection.connect(function(err){
        if (err) {
            return console.error(getCurrentTimestamp()+"Ошибка: " + err.message);
        }
        else{
            console.log(getCurrentTimestamp()+"Подключение к серверу MySQL успешно установлено");
        }

        let sql_query = 'CREATE TABLE IF NOT EXISTS guild_settings (`guild_id` BIGINT UNSIGNED NOT NULL UNIQUE, `settings` TEXT NOT NULL); '

        connection.query(sql_query, function (err) {
            if (err) throw err;
            console.log(getCurrentTimestamp()+"Таблица настроек создана");
        });

        sql_query = 'CREATE TABLE IF NOT EXISTS slot_stats (`user_id` BIGINT UNSIGNED NOT NULL UNIQUE, `total_games` INT DEFAULT 0, `total_wins` INT DEFAULT 0, `jackpots` INT DEFAULT 0);'

        connection.query(sql_query, function (err) {
            if (err) throw err;
            console.log(getCurrentTimestamp()+"Таблица слотов создана");
        });

        sql_query = 'CREATE TABLE IF NOT EXISTS rps_stats (`user_id` BIGINT UNSIGNED NOT NULL UNIQUE, `total_games` INT DEFAULT 0, `wins` INT DEFAULT 0, `draws` INT DEFAULT 0);'

        connection.query(sql_query, function (err) {
            if (err) throw err;
            console.log(getCurrentTimestamp()+"Таблица камня ножницы бумаги создана");
        });
    });

    return connection
}

async function setupUserData(user_id,table){
    let sql_query = `INSERT IGNORE INTO ${table} (user_id) VALUES (${user_id})`
    mySQLconnection.query(sql_query, function (err) {
        if (err) throw err;
        //console.log(getCurrentTimestamp()+"Пользователь создан");
    });
}

module.exports = {mySQLSetup, setupUserData}