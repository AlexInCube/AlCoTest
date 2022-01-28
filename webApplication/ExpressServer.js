const express = require('express')
const config = require("config");

const app = express()

require('./routes')(app)


async function start(){
    try{
        
    }catch (e) {
        console.warn("Ошибка с сервером сайта!", e.message)
        process.exit(1)
    }
}

start()

const PORT = config.get("PORT")
app.listen(PORT , () => (console.log("Веб-сервер запущен, сайт работает!")))