const express = require('express')
const app = express()
const { loggerSend } = require('../../../utilities/logger')
const MongoClient = require('mongodb').MongoClient

const mongoClient = new MongoClient('mongodb://localhost:27017/')
let collection
async function runMongo () {
  try {
    // Подключаемся к серверу
    await mongoClient.connect()
    // взаимодействие с базой данных
    collection = await mongoClient.db('aicdb').collection('patchnotes')
    loggerSend('Подключение к MongoDB успешно установлено')
  } catch (err) {
    console.log(err)
  }
}
runMongo()

module.exports = function (app) {
  app.get('/get_patch_notes', async function (request, response) {
    try {
      const updates = await collection.find({}).toArray()
      response.status(200).send(updates)
    } catch (e) {
      loggerSend(e)
      response.status(500).send('error 500')
    }
  })
}
