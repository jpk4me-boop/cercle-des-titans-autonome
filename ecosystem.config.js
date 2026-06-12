module.exports = {
  apps: [
    {
      name: 'cercle-titans',
      script: 'server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto-restart settings
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
