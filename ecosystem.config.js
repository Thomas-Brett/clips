module.exports = {
    apps: [
      {
        name: 'clips',
        script: 'node_modules/.bin/next',
        args: 'start -p 3001',
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
  