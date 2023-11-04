const path = require('path')
const config = require('config')
const express = require('express')
const { botVisit } = require("./bot")
const { v4: uuidv4 } = require('uuid')
const cookieParser = require('cookie-parser')
const { Sequelize, DataTypes } = require('sequelize')
const { cookie, validationResult } = require('express-validator')

const app = new express()

// public folder
app.use(express.static(path.join(__dirname, 'public')))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'views'))

// connect to sqlite db
const db = new Sequelize({
  dialect: 'sqlite',
  storage: config.dbfile,
  logging: false
})

const Post = db.define(
  'Post',
  {
    uuid: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    content: { type: DataTypes.STRING }
  },
  { timestamps: false, freezeTableName: true }
)

// create table Post if doesn't exists
Post.sync()

// truncate table every hour
setInterval(() => {
  Post.destroy({ truncate: true, cascade: false });
}, 3600000);

// super secure escape function, this is unhackable
const escape_string = unsafe =>
  JSON.stringify(unsafe)
    .slice(1, -1)
    .replace(/</g, '\\x3C')
    .replace(/>/g, '\\x3E')

const cookieOpt = {
  httpOnly: true,
  secure: config.env==="dev" ? false:true 
}

app.use((req, res, next) => {
  if (req.cookies.session === undefined) res.cookie('session', uuidv4(), cookieOpt)
  next()
})

// routes
app.get('/', (req, res) => {
  res.render('index.html')
})

app.get('/notes', (req, res, next) => {
  Post.findOne({ where: { uuid: req.cookies.session } }).then(post => {
    if (post) res.render('notes.html', { note: post.content })
    else res.render('notes.html')
  })
  .catch(err=> {next(err)})
})

app.get('/abe', (req, res) => {
  const secret = config.secret

  if (req.cookies.secret === secret) {
    const file = `${__dirname}/${config.abeFilePath}`
    res.download(file)
  } else res.send("Access denied<br><a href='/'>Back</a>")
})


app.post('/notes', cookie("session").notEmpty().isUUID(), (req, res, next) => {
  const errors = validationResult(req)

  if(!errors.isEmpty()) throw new Error("Cookie format isn't valid")
  const { session } = req.cookies
  const safe_payload = escape_string(req.body.note)
  const post = { uuid: session, content: safe_payload }
  const where = { uuid: session }
  Post.findOne({ where: where })
    .then(item => {
      if (item) Post.update(post, { where: where })
      else Post.create(post)
    })
    .then(() => res.redirect('/notes'))
    .catch(err => {next(err)})
})

app.post('/bot',cookie("session").notEmpty().isUUID(), (req, res) => {
  try {
  	const errors = validationResult(req);

  	if(!errors.isEmpty()) res.status(400).json({msg: "Cookie format isn't valid"})
  	else {

      botVisit(req.cookies.session).then(res.json({msg: 'Reported to Abe!'}))
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ msg: 'Some issue, report to webctf admin!' })
  }
})

app.use((req, res)=> res.render('404.html'))

app.use((err, req, res, next) =>{
  console.log(`${new Date().toLocaleString()}\n${err}`);
  res.render('500.html')
})

module.exports = app
