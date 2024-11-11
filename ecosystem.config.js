module.exports = {
  apps: [
    {
      name: 'clips',
      script: 'node_modules/next/dist/bin/next',
      interpreter: 'node',
      args: 'start -p 3001',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
