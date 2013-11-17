var mongoose = require('mongoose')
  , User     = mongoose.model('User')

module.exports = function(mapps) {

  var api = new require('./api')
  api.setMapps(mapps)

  mapps.app.get('/', function(req, res) {
    mapps.log.verbose('Worker ['+mapps.id+']', 'GET /')
    res.json(200, {status:'success', message:'API Alive and Kicking', worker: mapps.id})
  })

  function auth(req, res, next) {
    if (req.get('X-Auth-Token')) {
      var authToken = req.get('X-Auth-Token')
      req.authToken = authToken
      User.findOne({ authToken: authToken }, function(err, user) {
        if (err) {
          mapps.log.error('auth', 'Error finding user:', err)
          return res.json(401, error('Invalid auth token', err))
        }
        if (user) {
          req.user = user
          return next()
        } else {
          mapps.log.error('auth', 'Invalid auth token:', authToken)
          return res.json(401, error('Invalid auth token'))
        }
      })
    } else {
      return res.json(401, error('Invalid auth token'))
    }
  }

  mapps.app.all('*', auth)

  mapps.app.get('/api/v1/list', api.list)
  mapps.app.get('/api/v1/list/:appName', api.listOne)
  mapps.app.post('/api/v1/start/:appName', api.start)
  mapps.app.post('/api/v1/stop/:appName', api.stop)
  mapps.app.post('/api/v1/restart/:appName', api.restart)
  mapps.app.post('/api/v1/remove/:appName', api.remove)
  mapps.app.post('/api/v1/create', api.create)
  mapps.app.post('/api/v1/update/:appName', api.update)
  mapps.app.post('/api/v1/install/:appName', api.install)
  mapps.app.all('/api/v1/*', function(req, res) {
    return res.json(404, error('Not found'))
  })
}

function error(msg, err) {
  if (err) {
    return {
        status: 'error'
      , message: msg
      , error: err
    };
  }
  return {
      status: 'error'
    , message: msg
  };
}

function success(msg, data) {
  if (!msg) {
    return { status: 'success' };
  }

  var out = {
      status: 'success'
    , message: msg
  };

  if (data) out.data = data
  return out
}