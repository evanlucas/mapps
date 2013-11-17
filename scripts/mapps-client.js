var request = require('request')
  , log = require('npmlog')
  , env = process.env.NODE_ENV || 'development'
  , nconf = require('nconf')
  , program = require('commander')
  , config

try {
  config = require('../config/config-priv')[env]
}
catch (e) {
  config = require('../config/config')[env]
}


var client = exports
client.initialized = false
client.config = new nconf.File({ filename: 'config.json'})

client.load = function() {
  
}

client.uri = function() {
  
}

program
  .version('0.0.1')
  .option('-s, --set <key> <val>', 'Sets a config value')
  .option('-g, --get [key]', 'Gets a config value')
  .parse(process.argv)

program
  .command('get <path>')
  .description('performs a get request')
  .action(function(p) {
    request({ })
  })