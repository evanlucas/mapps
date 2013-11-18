var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , crypto   = require('crypto')
  , env = process.env.NODE_ENV || 'development'
  , path = require('path')
  , config

try {
  config = require('../config/config-priv')[env]
}
catch(e) {
  config = require('../config/config')[env]
}

var ApplicationSchema = new Schema({
  name: { type: String, index: true },
  label: { type: String, unique: true, index: true },
  path: { type: String },
  port: { type: Number, unique: true },
  env: { type: String, default: 'development' },
  author: { type: String },
  version: { type: String },
  pidFile: { type: String, unique: true },
  scriptName: { type: String },
  createdAt: { type: Date, default: Date.now },
  domains: [{ type: Schema.ObjectId, ref: 'Domain' }],
  emails: [{ type: String }]
})

ApplicationSchema.method('setName', function(name) {
  this.name = name
  this.label = 'com.'+config.companyId+'.'+name
  this.pidFile = path.join(config.pidPath, this.label+'.pid')
})

mongoose.model('App', ApplicationSchema)

var DomainSchema = new Schema({
  name: { type: String, unique: true }
})

mongoose.model('Domain', DomainSchema)

var UserSchema = new Schema({
  name: { type: String, unique: true },
  authToken: { type: String, unique: true, index: true },
  email: { type: String, unique: true }
})

UserSchema.method('generateAPIKey', function(date) {
  var d = (date).valueOf().toString()
  var ran = Math.random().toString()
  return crypto.createHash('sha1').update(d+ran).digest('hex')
})

mongoose.model('User', UserSchema)