#!/usr/bin/env node
var program     = require('commander')
  , pkg         = require('../package')
  , mapps       = require('../lib/index')
  , inquirer    = require('inquirer')

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
  .command('add-key <key>')
  .description('Adds an API key')
  .action(function(k) {

  })

program
  .command('rm-key <key>')
  .description('Removes an API key')
  .action(function(k) {

  })

program
  .command('list [name|label]')
  .description('List registered apps')
  .action(function() {

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
  .command('start')

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