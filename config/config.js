var path = require('path')
  , root = path.normalize(__dirname +'/..')

module.exports = {
  development: {
    root: root,
    user: 'apps',
    appsPath: 'apps',
    logsPath: 'logs',
    pidPath: 'pids',
    db: 'mongodb://mapps:mapps@localhost/mapps',
    port: 80,
    bindIp: '0.0.0.0',
    adminPort: 5044,
    adminHost: 'evanlucas.com',
    supportEmail: 'evan@curapps.com',
    companyId: 'curapps',
    nodePath: '/usr/local/bin/node',
    companyName: 'curapps',
    logoUrl: 'http://curapps.com/bootstrap/assets/img/logo.png',
    cssUrl: 'http://curapps.com/cbootstrap/assets/css/style.css'
  },
  test: {
    root: root,
    user: 'apps',
    appsPath: 'apps',
    logsPath: 'logs',
    pidPath: 'pids',
    db: 'mongodb://mapps:mapps@localhost/mapps',
    port: 80,
    bindIp: '0.0.0.0',
    adminPort: 5044,
    adminHost: 'evanlucas.com',
    supportEmail: 'evan@curapps.com',
    companyId: 'curapps',
    nodePath: '/usr/local/bin/node',
    companyName: 'curapps',
    logoUrl: 'http://curapps.com/bootstrap/assets/img/logo.png',
    cssUrl: 'http://curapps.com/cbootstrap/assets/css/style.css'
  },
  production: {
    root: root,
    user: 'apps',
    appsPath: 'apps',
    logsPath: 'logs',
    pidPath: 'pids',
    db: 'mongodb://mapps:mapps@localhost/mapps',
    port: 80,
    bindIp: '0.0.0.0',
    adminPort: 5044,
    adminHost: 'evanlucas.com',
    supportEmail: 'evan@curapps.com',
    companyId: 'curapps',
    nodePath: '/usr/local/bin/node',
    companyName: 'curapps',
    logoUrl: 'http://curapps.com/bootstrap/assets/img/logo.png',
    cssUrl: 'http://curapps.com/cbootstrap/assets/css/style.css'
  }
}