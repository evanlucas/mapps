var path     = require('path')
  , mkdirp   = require('mkdirp')
  , mongoose = require('mongoose')
  , fs       = require('fs')
  , cluster  = require('cluster')
  , env      = process.env.NODE_ENV || 'development'
  , mapps    = exports

mapps.log = require('npmlog')
mapps.log.heading = 'mapps'

try {
  mapps.config = require('../config/config-priv')[env]
}

catch(e) {
  mapps.config = require('../config/config')[env]
}

mapps.init = function() {
  mapps.log.verbose('mapps.init', 'Initializing')
  var root = mapps.config.root
  mkdirp.sync(root)
  mkdirp.sync(path.join(root, mapps.config.appsPath))
  mkdirp.sync(path.join(root, mapps.config.logsPath))
  mkdirp.sync(path.join(root, mapps.config.pidPath))
  mongoose.connect(mapps.config.db)
  require('./models')
}

mapps.init()

mapps.serve = function(workerCount) {
//  mapps.init()
  if (cluster.isMaster) {
    if (!(+workerCount)) workerCount = require('os').cpus().length
    mapps.log.info('serve', 'Spawning [%d] workers', workerCount)
    for (var i=0; i<workerCount; i++) {
      cluster.fork()
    }
  } else {
    var express = require('express')
    mapps.app = express()
    var publicDir = path.join(__dirname, '..', 'public')
    mapps.app.use(express.static(publicDir))
    mapps.app.use(express.logger('dev'))
    mapps.app.use(express.bodyParser())
    mapps.id = cluster.worker.id
    process.nextTick(function() {
      mapps.apps = require('./apps')(mapps)
      mapps.router = require('./router')(mapps)
      mapps.proxy = require('./proxy')(mapps)
      process.setuid(mapps.config.user)
      mapps.app.listen(mapps.config.adminPort)
      mapps.log.info('Worker ['+cluster.worker.id+']', 'Listening on port ['+mapps.config.adminPort+'] as user ['+process.getuid()+']')
    })
  }
}

mapps.daemonize = function() {
//  mapps.init()
  mapps.log.verbose('mapps.daemonize', 'Daemonizing mapps')
  mapps.log.info('daemonize', 'The server will now be managed by launchd')
  
}

mapps.addUser = function(name, email, authToken, cb) {
  if ('function' === typeof authToken) {
    cb = authToken
    authToken = null
  }
  var User = mongoose.model('User')
  var user = new User()
  user.name = name
  user.email = email
  user.authToken = authToken || user.generateAPIKey(new Date())
  user.save(function(err, user) {
    return cb && cb(err, user)
  })
}

mapps.listApps = function(nl, cb) {
  mapps.apps = require('./apps')(mapps)
  if ('function' === typeof nl) {
    cb = nl
    nl = null
  }
  
  if (nl) {
    mapps.apps.list(nl, cb)
  } else {
    mapps.apps.listAll(cb)
  }
}

mapps.listUsers = function(cb) {
  var User = mongoose.model('User')
  User.find({}, cb)
}

mapps.removeUserWithKey = function(key, cb) {
  var User = mongoose.model('User')
  User.findOne({ authToken: key }, function(err, user) {
    if (err) return cb && cb(err)
    user.remove(cb)
  })
}

mapps.isRunning = function() {
  return (mapps.apps)
}