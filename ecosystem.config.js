module.exports = {
  apps: [
    {
      name: 'next-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/app',
      env_file: '/var/www/app/.env.local',
      max_memory_restart: '512M',
    },
    {
      name: 'worker',
      script: 'node_modules/.bin/tsx',
      args: 'worker/index.ts',
      cwd: '/var/www/app',
      env_file: '/var/www/app/.env.local',
      max_memory_restart: '256M',
    },
  ],
}
