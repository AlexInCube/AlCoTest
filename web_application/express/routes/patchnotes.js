const { loggerSend } = require('../../../utilities/logger')
const express = require('express')
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')
const { ObjectId } = require('mongodb')

const mongoClient = new MongoClient('mongodb://localhost:27017/aicdb')
let collection
async function runMongo () {
  try {
    await mongoClient.connect()
    loggerSend('Подключение к MongoDB успешно установлено')

    try {
      await mongoClient.db('aicdb').createCollection('patchnotes')
    } catch (e) {
      if (e.codeName === 'NamespaceExists') {
        // loggerSend('Коллекция обновлений уже создана')
      } else {
        loggerSend(e)
      }
    }

    collection = await mongoClient.db('aicdb').collection('patchnotes')
  } catch (err) {
    console.log(err)
  }
}
runMongo()

module.exports = function (app) {
  const updatesRouter = express.Router()

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  updatesRouter.get('/get_total_count', async function (request, response) {
    const _count = await collection.estimatedDocumentCount()
    response.status(200).send({ count: _count })
  })

  updatesRouter.get('/get_updates/:page/:updates_per_page', async function (request, response) {
    const page = parseInt(request.params.page) - 1
    const updatesPerPage = parseInt(request.params.updates_per_page)

    await collection
      .find()
      .sort({ time: -1 })
      .skip(page * updatesPerPage)
      .limit(updatesPerPage)
      .toArray()
      .then((data) => {
        if (data.length === 0) {
          response.status(404).send('Data not found')
          return
        }
        response.status(200).send(data)
      }).catch(() => {
        response.status(404).send('Data not found')
      })
  })

  updatesRouter.post('/post_update', async function (request, response) {
    if (!request.session.user.detail.overpower) {
      response.status(403).send()
      return
    }
    const data = request.body

    const isNullish = Object.values(data).every(value => {
      return !value
    })

    if (isNullish || data.content === '' || data.name === '') {
      response.status(400).send()
      return
    }

    try {
      collection.insertOne(data, function (error) {
        if (error) throw error
        response.status(200).send()
      })
    } catch (e) {
      loggerSend(e)
      response.status(500).send()
    }
  })

  updatesRouter.delete('/delete_update/:post_id', function (request, response) {
    if (!request.session.user.detail.overpower) {
      response.status(403).send()
      return
    }
    try {
      collection.deleteOne({ _id: new ObjectId(request.params.post_id) }, function () {
        response.status(200).send()
      })
    } catch (e) {
      loggerSend(e)
      response.status(500).send()
    }
  })

  updatesRouter.put('/put_update/:post_id', async function (request, response) {
    if (!request.session.user.detail.overpower) {
      response.status(403).send()
      return
    }

    try {
      await collection.updateOne({ _id: new ObjectId(request.params.post_id) }, { $set: request.body })
      response.status(200).send()
    } catch (e) {
      loggerSend(e)
      response.status(500).send()
    }
  })

  app.use('/updates', updatesRouter)
}
