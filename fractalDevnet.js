const { takeSnapshotOfAllBalances } = require('./common')

takeSnapshotOfAllBalances({
  endpoint: 'wss://main.devnet.fractalprotocol.com',
  networkName: 'Fractal Devnet',
  outputFileName: 'fractal-devnet-balances.csv'
}).then().catch(console.error)
