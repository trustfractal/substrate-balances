const { takeSnapshotOfAllBalances } = require('./common')

takeSnapshotOfAllBalances({
  endpoint: 'wss://nodes.mainnet.fractalprotocol.com',
  networkName: 'Fractal Mainnet',
  outputFileName: 'fractal-mainnet-balances.csv'
}).then().catch(console.error)
