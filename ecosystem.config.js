module.exports = {
  apps: [
    {
      name: "nextjs",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "worker",
      script: "worker-dist/worker/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
