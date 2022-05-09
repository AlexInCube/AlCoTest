const { getCurrentTimestamp } = require('./tools')
const mysql = require('mysql2')
const config = require('config')

module.exports.mySQLSetup = () => {
  global.mySQLconnection = mysql.createConnection({
    host: config.get('DB_IP'),
    user: config.get('DB_USER'),
    database: config.get('DB_DATABASE'),
    password: config.get('DB_PASSWORD'),
    supportBigNumbers: true,
    bigNumberStrings: true
  })
  handleDisconnect(mySQLconnection)

  mySQLconnection.connect(function (err) {
    if (err) {
      return console.error(getCurrentTimestamp() + 'Ошибка: ' + err.message)
    } else {
      console.log(getCurrentTimestamp() + 'Подключение к серверу MySQL успешно установлено')
    }

    let sqlQuery = 'CREATE TABLE IF NOT EXISTS guild_settings (`guild_id` BIGINT UNSIGNED NOT NULL UNIQUE, `settings` TEXT NOT NULL); '

    mySQLconnection.query(sqlQuery, function (err) {
      if (err) throw err
      console.log(getCurrentTimestamp() + 'Таблица настроек создана')
    })

    sqlQuery = 'CREATE TABLE IF NOT EXISTS slot_stats (`user_id` BIGINT UNSIGNED NOT NULL UNIQUE, `total_games` INT DEFAULT 0, `total_wins` INT DEFAULT 0, `jackpots` INT DEFAULT 0);'

    mySQLconnection.query(sqlQuery, function (err) {
      if (err) throw err
      console.log(getCurrentTimestamp() + 'Таблица слотов создана')
    })

    sqlQuery = 'CREATE TABLE IF NOT EXISTS rps_stats (`user_id` BIGINT UNSIGNED NOT NULL UNIQUE, `total_games` INT DEFAULT 0, `wins` INT DEFAULT 0, `draws` INT DEFAULT 0);'

    mySQLconnection.query(sqlQuery, function (err) {
      if (err) throw err
      console.log(getCurrentTimestamp() + 'Таблица камня ножницы бумаги создана')
    })
  })

  return mySQLconnection
}

module.exports.setupUserData = (userId, table) => {
  const sqlQuery = `INSERT IGNORE INTO ${table} (user_id) VALUES (${userId})`
  mySQLconnection.query(sqlQuery, function (err) {
    if (err) throw err
    // console.log(getCurrentTimestamp()+"Пользователь создан");
  })
}

function handleDisconnect (client) {
  client.on('error', function (error) {
    if (!error.fatal) return
    // if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err

    console.error('Переподключение к базе данных')

    // NOTE: This assignment is to a variable from an outer scope; this is extremely important
    // If this said `client =` it wouldn't do what you want. The assignment here is implicitly changed
    // to `global.mysqlClient =` in node.
    mySQLconnection = mysql.createConnection(client.config)
    handleDisconnect(mySQLconnection)
    mySQLconnection.connect()
  })
}
