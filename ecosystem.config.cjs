// PM2 ecosystem config. Cluster mode managed by PM2 — set `cluster: false`
// in your app config so the internal node:cluster fork does not overlap.
module.exports = {
  apps: [
    {
      name: 'ryunacdn',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production'
      },
      env_qa: {
        NODE_ENV: 'qa'
      }
    }
  ]
}
