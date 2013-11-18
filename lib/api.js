/*!
 * Expose exports
 */
var API = exports

/*!
 * Set mapps so we can pass logging
 *
 * @param {Object} mapps The mapps object
 */
API.setMapps = function(mapps) {
  API.mapps = mapps
}

/**
 * HTTP Handler for `/api/v1/list`
 */
API.list = function(req, res) {
  API.mapps.apps.listAll(function(err, apps) {
    if (err) return res.json(error('Error listing apps', err))
    return res.json(success('Successfully listed apps', apps))
  })
}

/**
 * HTTP Handler for `/api/v1/list/:appName`
 */
API.listOne = function(req, res) {
  var name = req.params.appName
  API.mapps.apps.list(name, function(err, app) {
    if (err) return res.json(error('Error listing app', err))
    return res.json(success('Successfully listed app', app))
  })
}

/**
 * HTTP Handler for `/api/v1/start/:appName`
 */
API.start = function(req, res) {
  var name = req.params.appName
  API.mapps.apps.start(name, function(err) {
    if (err) return res.json(error('Error starting app', err))
    return res.json(success('Successfully started app'))
  })
}

/**
 * HTTP Handler for `/api/v1/stop/:appName`
 */
API.stop = function(req, res) {
  var name = req.params.appName
  API.mapps.apps.stop(name, function(err) {
    if (err) return res.json(error('Error stopping app', err))
    return res.json(success('Successfully stopped app'))
  })
}

/**
 * HTTP Handler for `/api/v1/restart/:appName`
 */
API.restart = function(req, res) {
  var name = req.params.appName
  API.mapps.apps.restart(name, function(err) {
    if (err) return res.json(error('Error restarting app', err))
    return res.json(success('Successfully restarted app'))
  })
}

/**
 * HTTP Handler for `/api/v1/remove/:appName`
 */
API.remove = function(req, res) {
  var name = req.params.appName
  API.mapps.apps.remove(name, function(err) {
    if (err) return res.json(error('Error removing app', err))
    return res.json(success('Successfully removed app'))
  })
}

/**
 * HTTP Handler for `/api/v1/create`
 */
API.create = function(req, res) {
  var url = req.body.url
    , dir = req.body.dir
    , env = req.body.env
  API.mapps.apps.create(url, dir, env, function(err) {
    if (err) return res.json(error('Error creating app', err))
    return res.json(success('Successfully created app'))
  })
}

/**
 * HTTP Handler for `/api/v1/update/:appName`
 */
API.update = function(req, res) {
  var name = req.params.appName
  API.mapps.apps.update(name, function(err) {
    if (err) return res.json(error('Error updating app', err))
    return res.json(success('Successfully updated app'))
  })
}

/**
 * HTTP Handler for `/api/v1/install/:appName`
 */
API.install = function(req, res) {}

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
