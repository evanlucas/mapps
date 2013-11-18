#!/usr/bin/env node
var program     = require('commander')
  , pkg         = require('../package')
  , mapps       = require('../lib/index')
  , inquirer    = require('inquirer')
  , Table       = require('cli-table')

program
  .command('serve')
  .description('Starts the mapps server')
  .action(function(k) {
    if (program.daemon) {
      mapps.daemonize(program.workers)
    } else {
      mapps.serve(program.workers)
    }
  })

program
  .command('status')
  .description('Checks the status of the mapps server')
  .action(function() {

  })

program
  .command('reboot')
  .description('Stops the server and restarts it')
  .action(function() {

  })

program
  .command('unload')
  .description('Stops the server and prevents it from being automatically loaded')
  .action(function() {

  })

program
  .command('create-user')
  .description('Create a new user')
  .action(function() {
    var q = [
      {type: 'input', name: 'name', message: 'Please enter the user\'s name'},
      {type: 'input', name: 'email', message: 'Please enter the user\'s email'}
    ]
    inquirer.prompt(q, function(answers) {
      mapps.addUser(answers.name, answers.email, function(err, user) {
        if (err) {
          mapps.log.error('create-user', 'Error creating user', err)
          process.exit(1)
        }
        mapps.log.info('create-user', 'Created user', user)
        process.exit()
      })
    })
  })

program
  .command('add-key')
  .description('Adds an API key')
  .action(function() {
    var q = [
      {type: 'input', name: 'key', message: 'Please enter the API key'},
      {type: 'input', name: 'name', message: 'Please enter the user\'s name'},
      {type: 'input', name: 'email', message: 'Please enter the user\'s email'}
    ]
    inquirer.prompt(q, function(a) {
      mapps.addUser(a.name, a.email, a.key, function(err, user) {
        if (err) {
          mapps.log.error('add-key', 'Error adding user with key', err)
          process.exit(1)
        }
        mapps.log.info('add-key', 'Created user', user)
        process.exit()
      })
    })
  })

program
  .command('list-users')
  .description('Lists all users')
  .action(function() {
    mapps.listUsers(function(err, users) {
      if (err) {
        mapps.log.error('list-users', 'Error listing users', err)
        process.exit(1)
      }
      var table = new Table({
        head: ['Name', 'Email', 'AuthToken']
      })
      users.forEach(function(user) {
        table.push([ user.name || '', user.email || '', user.authToken])
      })
      console.log(table.toString())
      process.exit()
    })
  })

program
  .command('rm-key <key>')
  .description('Removes an API key')
  .action(function(k) {
    mapps.removeUserWithKey(k, function(err) {
      if (err) {
        mapps.log.error('rm-key', 'Error removing user with key', err)
        process.exit(1)
      }
      process.exit()
    })
  })

program
  .command('list [name|label]')
  .description('List registered apps')
  .action(function(nl) {
    mapps.listApps(nl, function(err, apps) {
      if (err) {
        mapps.log.error('list', 'Error listing app', err)
        process.exit(1)
      }
      if (nl) {
        var table = new Table({
          head: ['Key', 'Value']
        })
        var keys = Object.keys(apps)
        keys.forEach(function(key) {
          if (key !== 'config') {
            table.push([key, apps[key]])
          }
        })
        
        if (apps.config) {
          var keys = Object.keys(apps.config)
          keys.forEach(function(k) {
            table.push([k, apps.config[k]])
          })
        }
        console.log(table.toString())
        process.exit()
      } else {
        var table = new Table({
          head: ['Name', 'Label', 'Port', 'Status']
        })
        apps.forEach(function(app) {
          mapps.log.info('App', app)
          table.push([ app.name, app.label || '', app.port, app.config.PID || app.config.pid || 'Not Running'])
  //        table.push([ app.name, app.label || '', app.port, app.config.PID])
        })
        console.log(table.toString())
        process.exit()
      }
    })
  })

program
  .command('stop <name>')
  .description('Stops an app')
  .action(function(app) {
    
  })

program
  .command('start <name>')
  .description('Starts an app')
  .action(function(app) {

  })

program
  .command('restart <name>')
  .description('Restarts an app')
  .action(function(app) {

  })


program
  .version(pkg.version)
  .usage('[options]')
  .option('-d, --daemon', 'Daemonize the server')
  .option('-v, --verbose', 'Increases verbosity')
  .option('-q, --quiet', 'Be quiet')
  .option('-w, --workers <count>', 'Number of workers to spin up')
  .parse(process.argv)

if (program.verbose) mapps.log.level = 'verbose'
if (program.quiet) mapps.log.level = 'error'