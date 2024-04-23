const local = '192.168.0.195';

module.exports = {
  connections: {
    transporter: {
      type: 'NATS',
      options: {
        servers: [`${local}:4222`],
      },
    },
  },
  proxy: {
    enabled: false,
    host: 'proxy.msq.local',
    port: 3128,
    protocol: 'http',
    username: 'develop',
    password: 'znhcf94oi0arlz8q',
  },
  web3: {
    ownerPrivateKey: 'e6f8fde90650d548c818fb3676987105e19b345e740429727a381b1237b31340',
    provider: {
      bsc: {
        // http: 'https://rpc.ankr.com/bsc/0a92c9288ddd85181db59c48d2eae9d07873954be63e06893de5b4cbcb37842e', //magic
        http: 'https://rpc.ankr.com/bsc/2fca0ce2706df0eb00e4581d62960277b1bc59e3576eb0d1a447347784f0cb7c', //my
        // http: 'https://bsc-mainnet.rpcfast.com?api_key=vhHppC9aVba67GlgUbSE9vvxEtNd89nkXtB7a7WYLllCmZF2NemLYrtVOSDrOEnZ', //bad
        // http: 'https://1rpc.io/tvpqgdSepPjNidAM/bnb', //bad
        // http: 'https://bsc-mainnet.nodereal.io/v1/3d0908cf1c5142b6933b7feef25a360a', //bad
      },
    },
    scheduler: {
      enable: true,
    },
  },
  integrations: {
    zealy: {
      apiKey: '',
      subdomain: '',
    },
  },
  protocol: 'https',
  host: 'msq.siera.tech/',
  logging: {
    level: 'info',
    type: 'console',
  },
};
