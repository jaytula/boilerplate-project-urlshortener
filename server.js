'use strict';

require('dotenv').config();
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var url = require('url');

var cors = require('cors');

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

mongoose.connect(
  process.env.MONGOLAB_URI,
  {useMongoClient: true},
);

var UrlSchema = mongoose.Schema({
  short: {type: Number, required: true, unique: true},
  url: {type: String, required: true},
});

var ConfigSchema = mongoose.Schema({
  name: {type: String, required: true, unique: true},
  value: {type: {}, required: true},
});

var Url = mongoose.model('Url', UrlSchema);
var Config = mongoose.model('Config', ConfigSchema);

Config.findOne({name: 'count'}, function(err, data) {
  if (err) return console.log(err);
  if (!data) {
    var initCount = new Config({name: 'count', value: 0});
    initCount.save(function(err, data) {
      if (err) return console.log(err);
    });
  }
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint...
app.get('/api/hello', function(req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', async function(req, res) {
  let data = {body: req.body};

  let count = await Config.findOne({name: 'count'});

  let short = count.value + 1;
  var newUrl = new Url({short, url: req.body.url});
  try {
    try {
      let host = url.parse(req.body.url).hostname;
      if (!host) throw 'invalid URL';
      dns.lookup(host, (err, address, family) => {});
    } catch (err) {
      res.json({error: err});
    }

    let data = newUrl.save();
    let result = await Config.findOneAndUpdate({name: 'count'}, {value: short});
    res.json({original_url: req.body.url, short_url: short});
  } catch (err) {
    res.json({err});
  }
});

app.get('/api/shorturl/:short', async function(req, res) {
  let short = req.params.short;
  short = /^\d+$/.test(short) ? Number(short) : null;

  let one = await Url.findOne({short});
  if (one) {
    return res.redirect(one.url);
  }
  res.status(404).send('Not found');
});

app.listen(port, function() {
  console.log('Node.js listening ...');
});
