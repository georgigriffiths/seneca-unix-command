'strict'
var exec = require('child_process').exec
var _ = require('lodash')
module.exports = function (options) {
  var seneca = this

  options = seneca.util.deepextend({
    encoding: 'utf8',
    env: Object.create(process.env)
  }, options)

  seneca.add({
    role: 'unix-command'
  }, function (msg, done) {
    var format = msg.format || 'string'
    var extra = msg.extra ? ' ' + msg.extra : ''
    var args = msg.args ? prepare_arguments(msg.args) : ''
    var cmd = msg.command + ' ' + args + extra
    var options = seneca.util.deepextend(options, msg.options)
    seneca.log.debug('COMMAND', cmd)
    seneca.log.debug('OPTIONS', options)
    var ps = exec(cmd, options, function (err, stdout, stderr) {
      if (err) {
        stderr = _.trim(stderr)
        return done(null, {
          error: stderr
        })
      }
      if (format === 'json') {
        stdout = JSON.parse(stdout)
      }
      if (format === 'string') {
        stdout = _.trim(stdout)
      }
      done(null, stdout)
    })
    ps.stdout.on('data', (data) => {
      seneca.log.debug('stdout', data)
    })
    ps.stderr.on('data', (data) => {
      seneca.log.debug('stderr', data)
    })
  })
  return 'unix-command'
}

function prepare_arguments (object) {
  var args = []
  _.each(object, function (value, key) {
    if (_.isPlainObject(value)) {
      _.each(value, function (value2, key2) {
        args = args.concat(['--' + key, '\'' + key2 + '=' + value2 + '\''])
      })
    }
    else if (_.isArray(value)) {
      _.each(value, function (value2) {
        args = args.concat(['--' + key, value2])
      })
    }
    else {
      args = args.concat(['--' + key])
      if (!_.isBoolean(value)) args = args.concat([value])
    }
  })
  return args.join(' ')
}
