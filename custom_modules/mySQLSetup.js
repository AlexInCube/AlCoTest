const { getCurrentTimestamp, loggerSend } = require('./tools')
const mysql = require('mysql2')

const options = {
  host: process.env.BOT_MYSQL_IP,
  user: process.env.BOT_MYSQL_USER,
  password: process.env.BOT_MYSQL_PASSWORD,
  database: process.env.BOT_MYSQL_DATABASE_NAME,
  supportBigNumbers: true,
  bigNumberStrings: true
}

module.exports.mySQLSetup = () => {
  global.mySQLconnection = mysql.createConnection(options)
  handleDisconnect(mySQLconnection)

  mySQLconnection.connect(function (err) {
    if (err) {
      return console.error(getCurrentTimestamp() + 'Ошибка: ' + err.message)
    } else {
      loggerSend('Подключение к MySQL успешно установлено')
    }

    let sqlQuery = 'CREATE TABLE IF NOT EXISTS guild_settings (`guild_id` BIGINT UNSIGNED NOT NULL UNIQUE, `settings` TEXT NOT NULL); '

    mySQLconnection.query(sqlQuery, function (err) {
      if (err) throw err
      // loggerSend('Таблица настроек создана')
    })

    sqlQuery = 'CREATE TABLE IF NOT EXISTS slot_stats (`user_id` BIGINT UNSIGNED NOT NULL UNIQUE, `total_games` INT DEFAULT 0, `total_wins` INT DEFAULT 0, `jackpots` INT DEFAULT 0);'

    mySQLconnection.query(sqlQuery, function (err) {
      if (err) throw err
      // loggerSend('Таблица слотов создана')
    })

    sqlQuery = 'CREATE TABLE IF NOT EXISTS rps_stats (`user_id` BIGINT UNSIGNED NOT NULL UNIQUE, `total_games` INT DEFAULT 0, `wins` INT DEFAULT 0, `draws` INT DEFAULT 0);'

    mySQLconnection.query(sqlQuery, function (err) {
      if (err) throw err
      // loggerSend('Таблица камня ножницы бумаги создана')
    })
  })

  return mySQLconnection
}

module.exports.setupUserData = (userId, table) => {
  const sqlQuery = `INSERT IGNORE INTO ${table} (user_id) VALUES (${userId})`
  mySQLconnection.query(sqlQuery, function (err) {
    if (err) throw err
  })
}

function handleDisconnect (client) {
  client.on('error', function (error) {
    if (!error.fatal) return
    // if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err

    loggerSend('Переподключение к базе данных')

    mySQLconnection = mysql.createConnection(options)
    handleDisconnect(mySQLconnection)
    mySQLconnection.connect()
  })
}
