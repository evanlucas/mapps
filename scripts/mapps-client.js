#!/usr/bin/env node
var request = require('request')
  , log     = require('npmlog')
  , env     = process.env.NODE_ENV || 'development'
  , nconf   = require('nconf')
  , program = require('commander')
  , Table   = require('cli-table')
  , inq     = require('inquirer')


var client = exports
client.initialized = false
client.config = new nconf.File({ file: 'config.json'})

client.load = function() {
  client.config.loadSync()
  if (!client.config.get('host')) {
    client.config.set('host', '127.0.0.1')
  }
  if (!client.config.get('port')) {
    client.config.set('port', 5044)
  }
  
  
  client.config.saveSync()
}

client.load()

if (!client.config.get('authToken')) {
  var q = [
    {type: 'input', name: 'authToken', message: 'Please enter your authToken'}
  ]
  inq.prompt(q, function(a) {
    client.config.set('authToken', a.authToken)
    client.config.saveSync()
    log.info('config', 'You are now ready to run mapps-client')
    process.exit()
  })
}

client.uri = function(p) {
  var url = 'http://'+client.config.get('host')+':'+client.config.get('port')
  url += p
  return url
}

program
  .command('get <path>')
  .description('performs a get request')
  .action(function(p) {
    //request({ })
    var uri = client.uri(p)
    log.http('GET', uri)
    var headers = {
      'X-Auth-Token': client.config.get('authToken')
    };
    request({uri: uri, json: true, headers: headers}, function(err, res, body) {
      if (err) {
        if (err.code && err.code === 'ECONNREFUSED') {
          log.error('GET', 'Received Error', err)
          log.error('GET', 'Is the mapps server running?')
          process.exit(1)
        } else {
          log.error('GET', 'Error requesting URL', err)
          process.exit(1)
        }
      }
      if (+res.statusCode === 200) {
        log.http('200', uri)
        log.info('GET', 'Request Successful')
        log.info('GET', body)
        process.exit()
      } else if (+res.statusCode === 404) {
        log.http('404', uri)
        log.error('GET', 'Received 404 from server')
        process.exit()
      } else {
        log.http(res.statusCode, uri)
        log.info('GET', body)
        process.exit()
      }
    })
  })

program
  .command('config <action> [key] [val]')
  .description('get/set config keys')
  .action(function(action, arg1, arg2) {
    if (action === 'get') {
      var table = new Table({
        head: ['Key', 'Value']
      })
      var config = client.config.get(arg1)
      
      if (!arg1) {
        var keys = Object.keys(config)
        keys.forEach(function(key) {
          table.push([key, config[key]])
        })
      } else {
        table.push([arg1, config])
      }
      console.log(table.toString())
      process.exit()
    } else if (action === 'set') {
      if (!arg1 || !arg2) {
        log.error('config', 'Invalid arguments')
        log.error('config', 'The following arguments are required')
        log.error('config', '=>', '<key>', '<val>')
        process.exit(1)
      } else {
        client.config.set(arg1, arg2)
        client.config.saveSync()
      }
    } else {
      log.error('config', 'Invalid action', '`'+action+'`')
      log.error('config', 'The following are accepted actions')
      log.error('config', '=>', 'get', '[key]')
      log.error('config', '=>', 'set', '<key>', '<value>')
      process.exit(1)
    }
  })


program
  .version('0.0.1')
  .option('-s, --conf-set <key> <val>', 'Sets a config value')
  .option('-g, --conf-get [key]', 'Gets a config value')
  .parse(process.argv)
