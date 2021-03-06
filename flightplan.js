// flightplan.js 
var plan = require('flightplan');
 
// configuration 
plan.target('staging', {
  host: '45.55.172.29',
  username: 'app',
  agent: process.env.SSH_AUTH_SOCK,
  privateKey: process.env.HOME + '/.ssh/id_rsa'
});
 
// plan.target('production', [
//   {
//     host: 'www1.example.com',
//     username: 'pstadler',
//     agent: process.env.SSH_AUTH_SOCK
//   },
//   {
//     host: 'www2.example.com',
//     username: 'pstadler',
//     agent: process.env.SSH_AUTH_SOCK
//   }
// ]);
 
var tmpDir = 'app-' + new Date().getTime();
 
// run commands on localhost 
plan.local(function(local) {
  // local.exec('whoami');
  // local.log('Run build');
  // local.exec('gulp build');

  local.log('Copy files to remote hosts');
  var filesToCopy = local.exec('git ls-files', {silent: true});
  // rsync files to all the target's remote hosts 
  local.transfer(filesToCopy, '/tmp/' + tmpDir);
});
 
// run commands on the target's remote hosts 
plan.remote(function(remote) {
  remote.log('Move folder to web root');
  remote.sudo('cp -R /tmp/' + tmpDir + ' ~', {user: 'app'});
  remote.rm('-rf /tmp/' + tmpDir);
 
  remote.log('Install dependencies');
  remote.sudo('npm --production --prefix ~/' + tmpDir
                            + ' install ~/' + tmpDir, {user: 'app'});
 
  remote.log('Reload application');
  remote.sudo('ln -snf ~/' + tmpDir + ' ~/app-current', {user: 'app'});
  remote.sudo('pm2 reload app-current/processes.json', {user: 'app'});
});