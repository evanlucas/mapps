var fs      = require('fs.extra')
  , path    = require('path')
  , spawn   = require('child_process').spawn
  , npm     = require('npm')

var npmConfig = {
    _exit: false
  , exit: false
  , 'unsafe-perm': true
  , loglevel: 'silent'
  , production: true
};

module.exports = Exec

function Exec(mapps) {
  this.mapps = mapps
}

// Taken from node-gitteh install.js
// It is licensed under the MIT license
// The file can be found at https://github.com/libgit2/node-gitteh/blob/master/install.js

Exec.prototype.passthru = function() {
  var args = Array.prototype.slice.call(arguments)
    , cb = args.splice(-1)[0]
    , cmd = args.splice(0, 1)[0]
    , opts = {}
    , self = this

  if (typeof args.slice(-1)[0] === 'object') {
    opts = args.splice(-1)[0]
  }
  var msgs = []
  var child = spawn(cmd, args, opts)
  child.stdout.on('data', function(d) {
    var s = d.toString()
    console.log(s)
    msgs.push(s)
  })
  child.stderr.on('data', function(d) {
    var s = d.toString()
    console.log(s)
  })
  child.on('exit', function(err) {
    console.log('exit, status', err)
    if (err) {
      if ('object' === typeof err) {
        var code = err
        err = new Error('Process exited with non-zero return code')
        err.code = code
      }
      err.msgs = msgs
    }
    return cb(err)
  })
}

Exec.prototype.shpassthru = function() {
  this.passthru.apply(null, ['/bin/sh', '-c'].concat(Array.prototype.slice.call(arguments)))
}

Exec.prototype.envpassthru = function() {
  this.passthru.apply(null, ['/usr/bin/env'].concat(Array.prototype.slice.call(arguments)))
}

Exec.prototype.cloneToPath = function(url, dir, cb) {
  dir = path.join(this.mapps.config.appsPath, dir)
  this.mapps.log.info('clone', url, dir)
  this.envpassthru('git', 'clone', url, dir, cb)
}

Exec.prototype.pullAtPath = function(dir, cb) {
  this.envpassthru('git', 'pull', { cwd: dir }, cb)
}

Exec.prototype.install = function(dir, cb) {
  this.envpassthru('npm', 'install', { cwd: dir }, cb)
}

// The below functions were taken from haibu
// The file can be found at https://github.com/nodejitsu/haibu/blob/master/lib/haibu/common/npm.js
//
Exec.prototype.loadNpm = function(cb) {
  var self = this
  npm.load(npmConfig, function(err) {
    if (err) {
      self.mapps.log.error('loadNpm', 'Error loading npm config:', err)
      return cb && cb(err)
    }
    self.mapps.log.verbose('Successfully loaded npm config')
    cb && cb()
  })
}

Exec.prototype.loadNpmDepends = function(app, cb) {
  var self = this
  self.loadNpm(function(err) {
    if (err) return cb && cb(err)
    if (typeof app.dependencies === 'undefined' || Object.keys(app.dependencies).length === 0) {
      self.mapps.log.warn('loadNpmDepends', 'No dependencies to load')
      return cb && cb(null, true)
    }
    var depends = Object.keys(app.dependencies)
    return cb && cb(null, depends)
  })
}

Exec.prototype.npmInstall = function(dir, target, cb) {
  var self = this
  if (!dir) {
    var err = new Error('Cannot install npm dependencies without a target directory')
    self.mapps.log.error('install', 'Error installing npm dependencies:', err)
    return cb && cb(err)
  }
  var meta = {};

  function installAll(deps) {
    npm.commands.install(dir, deps, function(err) {
      if (err) return cb && cb(err)
      cb && cb(null, deps)
    })
  }

  function loadAppAndInstall(app) {
    self.loadNpmDepends(target, function(err, deps) {
      if (err) return cb && cb(err)
      if (deps === true) return cb && cb(null, [])
      meta = {
          app: target.name
        , dependencies: deps
      };
      installAll(deps)
    })
  }

  function loadAndInstall() {
    meta = { packages: target };
    self.loadNpm(function(err) {
      if (err) return cb && cb(err)
      installAll(target)
    })
  }

  return Array.isArray(target) ? loadAndInstall() : loadAppAndInstall()
}