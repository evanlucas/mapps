/**
 * Module depends
 */
var ctl      = require('launchctl')
  , mongoose = require('mongoose')
  , env      = process.env.NODE_ENV || 'development'
  , fs       = require('fs.extra')
  , path     = require('path')
  , touch    = require('touch')
  , _        = require('underscore')
  , Exec     = require('./exec')
  , async    = require('async')
  , App      = mongoose.model('App')
  , Domain   = mongoose.model('Domain')

/*!
 * Expose exports
 */
module.exports = Apps

/**
 * Constructor
 *
 * @param {Object} mapps The mapps object
 * @api public
 */
function Apps(mapps) {
  if (!(this instanceof Apps)) return new Apps(mapps)
  this.mapps = mapps
}

/**
 * Returns a reverse DNS name using mapps.config.companyId
 *
 * @param {String} name The app name
 * @api public
 */
Apps.prototype.labelFromName = function(name) {
  var self = this
  return self.mapps.config.companyId+'.'+name
}

/**
 * Finds an app with the given _name_
 * If it does not exist, returns an error
 *
 * @param {String} name The app name
 * @param {Function} cb function(err, app)
 * @api public
 */
Apps.prototype.findByName = function(name, cb) {
  App.findOne({name:name}, function(err, app) {
    if (err) return cb && cb(err)
    if (!app) return cb && cb(new Error('App does not exist'))
    return cb && cb(null, app)
  })
}

/**
 * Finds an app with the given _label_
 * If it does not exist, returns an error
 *
 * @param {String} label The app label
 * @param {Function} cb function(err, app)
 * @api public
 */
Apps.prototype.findByLabel = function(label, cb) {
  App.findOne({label: label}, function(err, app) {
    if (err) return cb && cb(err)
    if (!app) return cb && cb(new Error('App does not exist'))
    return cb && cb(null, app)
  })
}

/**
 * Finds an app with the given _nl_
 * Searches on the name key first
 * If it does not find one, search on label
 *
 * @param {String} nl The name or label
 * @param {Function} cb function(err, app)
 * @api public
 */
Apps.prototype.findOne = function(nl, cb) {
  var self = this
  self.findByName(nl, function(err, app) {
    if (err) {
      return self.findByLabel(nl, cb)
    } else {
      return cb && cb(null, app)
    }
  })
}

/**
 * Reads the package.json at the given _fp_
 *
 * @param {String} fp The path to the package.json
 * @param {Function} cb function(err, pkg)
 * @api public
 */
Apps.prototype.readPackage = function(fp, cb) {
  var self = this
  fs.readFile(fp, 'utf8', function(err, contents) {
    if (err) return cb && cb(err)
    try {
      var pkg = JSON.parse(contents)
      if (!pkg.hasOwnProperty('name')) return cb && cb(new Error('Missing key `name` in package.json'))
      if (!pkg.hasOwnProperty('author')) return cb && cb(new Error('Missing key `author` in package.json'))
      if (!pkg.hasOwnProperty('main')) return cb && cb(new Error('Missing key `main` in package.json'))
      if (!pkg.hasOwnProperty('version')) return cb && cb(new Error('Missing key `version` in package.json'))
      return cb && cb(null, pkg)
    }
    catch(e) {
      return cb && cb(e)
    }
  })
}

/**
 * Reads the config at the given _fp_ with the given _env_
 *
 * @param {String} fp The path the config file
 * @param {String} env The environment (`development`, `test`, or `production`)
 * @param {Function} cb function(err, conf)
 * @api public
 */
Apps.prototype.readConfig = function(fp, env, cb) {
  var self = this
  try {
    // will this cache though?
    var conf = require(path.resolve(fp))[env]
    if (!conf.hasOwnProperty('port')) return cb && cb(new Error('Missing key `port` in config.js'))
    if (!conf.hasOwnProperty('hostname')) return cb && cb(new Error('Missing key `hostname` in config.js'))
    if (!conf.hasOwnProperty('emails')) return cb && cb(new Error('Missing key `emails` in config.js'))
    return cb && cb(null, conf)
  }
  catch(e) {
    return cb && cb(e)
  }
}

/**
 * Populates an app in the given _dir_
 *
 * @param {Object} app An app schema or null
 * @param {String} dir The directory name of the app
 * @param {String} env The app env (`development`, `test`, or `production`)
 * @param {Function} cb function(err, app)
 * @api public
 */
Apps.prototype.populate = function(app, dir, env, cb) {
  var self = this
  if (!app) app = new App()
  if (!env) {
    env = 'development'
  }
  app.env = env
  if (!fs.existsSync(dir)) {
    return cb && cb(new Error(dir+' does not exist'))
  }

  var pkgPath = path.join(dir, 'package.json')
    , confPath = path.join(dir, 'config', 'config-priv.js')
  
  if (!fs.existsSync(pkgPath)) {
    return cb && cb(new Error(pkgPath+' does not exist'))
  }

  if (!fs.existsSync(confPath)) {
    confPath = path.join(dir, 'config', 'config.js')
    if (!fs.existsSync(confPath)) {
      return cb && cb(new Error(confPath+' does not exist'))
    }
  }

  async.parallel([
    function(c) {
      self.readPackage(pkgPath, function(err, pkg) {
        if (err) return c(err)
        app.setName(pkg.name)
        app.author = pkg.author
        app.scriptName = pkg.main
        app.version = pkg.version
        c()
      })
    },
    function(c) {
      self.readConfig(confPath, env, function(err, conf) {
        if (err) return c(err)
        app.port = conf.port
        if (Array.isArray(conf.emails)) {
          app.emails = conf.emails
        } else {
          app.emails = [conf.emails]
        }
        var doms = (Array.isArray(conf.hostname)) ? conf.hostname : [conf.hostname]
          , domains = []

        function addDom(name, callback) {
          Domain.findOne({name:name}, function(err, dom) {
            if (err) {
              self.mapps.log.error('domain', 'Error finding domain', err)
              return callback && callback(err)
            }
            if (!dom) {
              self.mapps.log.info('domain', name, 'does not exist')
              dom = new Domain()
              dom.name = name
              dom.save(function(err) {
                if (err) return callback && callback(err)
                domains.push(dom)
                return callback && callback(null, dom)
              })
            } else {
              self.mapps.log.info('domain', name, 'does exist')
              domains.push(dom)
              return callback && callback(null, dom)
            }
          })
        }

        async.each(doms, addDom, function(err) {
          if (err) {
            self.mapps.log.error('domain', 'Error adding domain:', err)
            return c && c(err)
          } else {
            app.domains = domains
            app.path = dir
            return c && c(null, app)
          }
        })
      })
    }
  ], function(err) {
    if (err) {
      self.mapps.log.error('app', 'Error adding app:', err)
    }
    return cb && cb(err, app)
  })
}

/**
 * Starts the app with the given _name_
 *
 * @param {String} name The name or label of the app
 * @param {Function} cb function(err)
 * @api public
 */
Apps.prototype.start = function(name, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) return cb && cb(err)
    if (fs.existsSync(app.pidFile)) {
      fs.unlinkSync(app.pidFile)
    }
    ctl.start(app.label, function(err) {
      if (err) return cb && cb(err)
      touch(app.pidFile, function(err) {
        if (err) return cb && cb(err)
        return cb && cb()
      })
    })
  })
}

/**
 * Stops the app with the given _name_
 *
 * @param {String} name The name or label of the app
 * @param {Function} cb function(err)
 * @api public
 */
Apps.prototype.stop = function(name, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) return cb && cb(err)
    if (fs.existsSync(app.pidFile)) {
      fs.unlinkSync(app.pidFile)
    }
    ctl.stop(app.label, function(err) {
      return cb && cb(err, app)
    })
  })
}

/**
 * Restarts the app with the given _name_
 *
 * @param {String} name The name or label of the app
 * @param {Function} cb function(err)
 * @api public
 */
Apps.prototype.restart = function(name, cb) {
  var self = this
  self.stop(name, function(err) {
    if (err) return cb && cb(err)
    self.start(name, cb)
  })
}

/**
 * Creates a new app by cloning the given _url_
 * into the given _dir_.
 * It then populates the app for the given _env_
 *
 * @param {String} url The (clonable) git url
 * @param {String} dir The directory name to which it will be cloned
 * @param {String} env The app env (`development`, `test`, or `production`)
 * @param {Function} cb function(err)
 * @api public
 */
Apps.prototype.create = function(url, dir, env, args, cb) {
  var self = this
  if (!dir || dir === '') {
    return cb && cb(new Error('Invalid directory'))
  }
  if (!url || url === '') {
    return cb && cb(new Error('Invalid git url'))
  }
  
  if ('function' === typeof args) {
    cb = args
    args = [self.mapps.config.nodePath]
  }

  var absDir = path.join(self.mapps.config.appsPath, dir)
  var exec = new Exec(self.mapps)
  exec.cloneToPath(url, dir, function(err) {
    if (err) {
      return cb && cb(err)
    } else {
      self.populate(null, absDir, env, function(err, app) {
        if (err) {
          self.mapps.log.error('create', 'Error populating app', err)
          return cb && cb(err)
        }
        app.args = args
        app.save(function(err) {
          if (err) {
            self.mapps.log.error('create', 'Error saving app', err)
            return cb && cb(err)
          }
          self.mapps.log.verbose('create', 'Successfully created app:', app.name)
          return cb && cb()
        })
        
      })
    }
  })
}

/**
 * Updates the app
 *
 * 1. Performs `git pull`
 * 2. Performs `npm install`
 *
 * @param {String} name The app name
 * @param {Function} cb function(err)
 * @api public
 */
Apps.prototype.update = function(name, cb) {
  var self = this
  var exec = new Exec(self.mapps)
  self.findOne(name, function(err, app) {
    if (err) return cb && cb(err)
    var dir = path.join(self.mapps.config.appsPath, app.path)
    exec.pullAtPath(dir, function(err) {
      if (err) return cb && cb(err)
      exec.install(dir, cb)
    })
  })
}

/**
 * Changes the env for the app the given _name_
 *
 * @param {String} name The app name
 * @param {String} env The NODE_ENV for the app
 * @param {Function} cb function(err)
 * @api public
 */
Apps.prototype.changeEnv = function(name, env, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) return cb && cb(err)
    app.env = env
    self.generatePlist(app, function(err) {
      if (err) return cb && cb(err)
      return cb && cb()
    })
  })
}

/**
 * Removes the app with the given _name_
 *
 * 1. Attempts to stop the app
 * 2. Deletes the launchd plist
 * 3. Deletes the app from the database
 *
 * @param {String} name The app name
 * @param {Function} cb function(err)
 * @api public
 */
Apps.prototype.remove = function(name, cb) {
  var self = this
  self.stop(name, function(err, app) {
    if (err) self.mapps.log.error('remove', 'Error stopping app', err)
    fs.unlink(app.plistPath, function(err) {
      if (err) return cb && cb(err)
      app.remove(cb)
    })
  })
}

/**
 * Lists all registered applications
 *
 * @param {Function} cb function(err, apps)
 * @api public
 */
Apps.prototype.listAll = function(cb) {
  App
    .find({})
    .lean()
    .exec(function(err, apps) {
      if (err) return cb && cb(err)
      var result = _.map(apps, function(app) {
        try {
          var c = ctl.listSync(app.label)
          app.config = c
        }
        catch(e) {
          app.config = {}
        }
        return app
      })
      return cb && cb(null, result)
    })
}

/**
 * Lists a single application with the given _name_
 *
 * @param {String} name The name or label
 * @param {Function} cb function(err, app)
 * @api public
 */
Apps.prototype.list = function(name, cb) {
  var self = this
  self.findOne(name, function(err, app) {
    if (err) return cb && cb(err)
    app = app.toJSON()
    try {
      var c = ctl.listSync(app.label)
      app.config = c
    }
    catch(e) {
      app.config = {}
    }
    return cb && cb(null, app)
  })
}

/**
 * Generates and writes the launchd plist for the given _app_
 *
 * @param {Object} app The app
 * @param {Function} cb function(err)
 * @api public
 */
Apps.prototype.generatePlist = function(app, cb) {
  var self = this
  var plist = new ctl.Plist()
  plist.setLabel(app.label)
  plist.setUserName(self.mapps.config.user)
  plist.setRunAtLoad(true)
  var opts = {};
  opts[app.pidFile] = true
  plist.setKeepAlive(opts)
  var logs = self.mapps.config.logsPath
  plist.setStdErrPath(path.join(logs, self.labelFromName(app.name)+'.error.log'))
  plist.setStdOutPath(path.join(logs, self.labelFromName(app.name)+'.log'))
  var args = app.execArgs
  args.push(path.join(self.mapps.config.appsPath, app.path, app.scriptName))
  plist.setProgramArgs(args)
  plist.setEnvVar({
    'NODE_ENV': app.env
  })
  var contents = plist.build()
  fs.writeFile(app.plistPath, contents, 'utf8', function(err) {
    if (err) return cb && cb(err)
    return cb && cb()
  })
}
