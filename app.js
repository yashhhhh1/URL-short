const express = require('express')
const shortId = require('shortid')
const createHttpError = require('http-errors')
const mongoose = require('mongoose')
const path = require('path')
const ShortUrl = require('./models/url.model')

const app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// connection to db
mongoose
  .connect('mongodb://127.0.0.1:27017', {
    dbName: 'url-shortner',
    useNewUrlParser: true,
    useUnifiedTopology: true,
 
  })
  .then(() => console.log('mongoose connected 💾'))
  .catch((error) => console.log(`Error connecting..   ${error}`))

app.set('view engine', 'ejs')

// main page render  
app.get('/', async (req, res, next) => {
  const allurl = await ShortUrl.find({});
  // console.log(allurl);
  res.render('index' , {urls:allurl});
})

// main page data render 
app.post('/', async (req, res, next) => {
  try {
    const { url } = req.body;
    // if url is valid or not check 
    if (!url) {
      throw createHttpError.BadRequest('Provide a valid url')
    }
    // if url is exit then check in the db 
    const urlExists = await ShortUrl.findOne({ url })
    // url exist then show th main page 
    if (urlExists) {
      res.render('index', {short_url: `${req.headers.host}/${urlExists.shortId}`,})
      return
    }
    // url is new then add in the db and genrate the new shortid provided url 
    const shortUrl = new ShortUrl({ url: url, shortId: shortId.generate() })
    // and save the url in db
    const result = await shortUrl.save()
    // after the save new user in db then render the main page 
    res.render('index', {short_url: `${req.headers.host}/${result.shortId}`,})
  } catch (error) {
    next(error)
  }
})

// search in browser 
app.get('/:shortId', async (req, res, next) => {
  try {
    // check the shrotid is exist in db 
    const { shortId } = req.params
    const result = await ShortUrl.findOne({ shortId })
    if (!result) {
      throw createHttpError.NotFound('Short url does not exist')
    }
    // and it is exist the render the main link 
    res.redirect(result.url)
  } catch (error) {
    next(error)
  }
})

app.use((req, res, next) => {
  next(createHttpError.NotFound())
})

app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.render('index', { error: err.message })
})

app.listen(3000, () => console.log(`http://localhost:3000/`))
 