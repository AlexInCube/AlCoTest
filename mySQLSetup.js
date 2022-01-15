function mySQLSetup(){
    const mysql = require("mysql2");
    const config = require("./config.json");
    const {getCurrentTimestamp} = require("./tools");

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

        let sql_query = "CREATE TABLE IF NOT EXISTS guild_settings (guild_id INT NOT NULL, settings TEXT NOT NULL)"

        connection.query(sql_query, function (err) {
            if (err) throw err;
            console.log(getCurrentTimestamp()+"Таблица настроек создана");
        });
    });
}

module.exports = {mySQLSetup}