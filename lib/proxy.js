/*!
 *
 * The logic in this file originated from stagecoach
 * which can be found at http://github.com/punkave/stagecoach
 *
 * It is licensed under the MIT license
 *
 * Thanks to the devs at punkave
 */

/**
 * Module depends
 */
var httpProxy = require('http-proxy')
  , jade      = require('jade')
  , path      = require('path')
  , fs        = require('fs')
  , mongoose  = require('mongoose')
  , App       = mongoose.model('App')

/*!
 * Expose exports
 */
module.exports = Proxy

/**
 * Constructor
 *
 * @param {Object} mapps The mapps object
 * @api public
 */
function Proxy(mapps) {
  if (!(this instanceof Proxy)) return new Proxy(mapps)
  this.proxyServer = null
  this.mapps = mapps
  this.table = null
  this.options = {};
  this.init()
}

/**
 * Generates a local url based on configuration settings
 *
 * @param {String} p The path
 * @api public
 * @returns String
 */
Proxy.prototype.localUrl = function(p) {
  var self = this
  return 'http://'+self.mapps.config.adminHost+':'+self.mapps.config.adminPort+p
}

/**
 * Sets up our proxy server
 * 
 * 1. Builds the initial routing table
 * 2. Listens for the `proxyError` event in which it will render a static page
 *    stating that the site is down for maintenance
 */
Proxy.prototype.init = function() {
  var self = this

  this.rebuildRouter(function(err, router) {
    if (err) {
      self.mapps.log.error('Error building router', err)
    } else {
      self.options.router = router
      self.mapps.log.verbose('proxy.init', 'Starting proxy server on port [%s:%d]', self.mapps.config.bindIp, self.mapps.config.port)
      self.proxyServer = httpProxy.createServer(self.options).listen(self.mapps.config.port, self.mapps.config.bindIp)
      self.proxyServer.proxy.on('proxyError', function(err, req, res) {
        var host = req.headers.host || 'This site'
        self.mapps.log.error('proxyError', 'Error proxying request', err)

        var companyName = self.mapps.config.companyName || 'curapps'
          , logo = self.mapps.config.logoUrl || self.localUrl('/img/logo.png')
          , css = self.mapps.config.cssUrl || self.localUrl('/css/style.css')

        var filename = path.join(path.normalize(__dirname+'/..'), 'views', 'error.jade')
        var html = jade.renderFile(filename, {
          companyName: companyName,
          logoUrl: logo,
          cssUrl: css,
          host: host
        })

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.write(html)
        res.end()
      })

      self.table = self.proxyServer.proxy.proxyTable
      self.setup()
    }
  })
}

/**
 * Rebuilds the routing table
 *
 * Does not need to check if the domain is already in use since that is done
 * in the saving validation
 *
 * @param {Function} cb function(err, router)
 * @api public
 */
Proxy.prototype.rebuildRouter = function(cb) {
  var self = this
  self.mapps.log.verbose('Worker ['+self.mapps.id+']', 'Rebuilding Router')
  var router = {};
  App.find({}, function(err, servers) {
    if (err) return cb && cb(err)
    servers.forEach(function(server) {
      var local = '127.0.0.1:'+server.port
      server.domains.forEach(function(host) {
        self.mapps.log.verbose('virtual', host)
        router[host] = local
      })
    })

    return cb && cb(null, router)
  })
}

/**
 * Configures the proxy server to fallback to another port
 * Useful if you want to run apache or nginx behind this
 */
Proxy.prototype.setup = function() {
  var self = this
  if (!self.table) return setTimeout(self.setup(), 200)
  if (self.mapps.config.passthruPort) {
    self.table.superGetProxyLocation = self.table.getProxyLocation
    self.table.getProxyLocation = function(req) {
      var location = self.table.superGetProxyLocation(req)
      if (location) return location
      return {
        host: '127.0.0.1',
        port: self.mapps.config.passthruPort
      };
    };
  }
}

/**
 * Forces the routing table to be rebuilt
 */
Proxy.prototype.resetRouter = function() {
  var self = this
  self.mapps.log.verbose('Worker ['+self.mapps.id+']', 'Resetting Router')
  self.rebuildRouter(function(err, router) {
    if (!router) {
      self.mapps.log.warn('Router not available...waiting...')
      setTimeout(self.resetRouter, 2000)
      return
    } else {
      var table = self.proxyServer.proxy.proxyTable
      table.setRoutes(router)
      self.proxyServer.proxy.proxyTable.emit('routes', self.proxyServer.proxy.proxyTable.router)
    }
  })
}