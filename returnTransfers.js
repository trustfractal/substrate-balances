const { WsProvider, ApiPromise, Keyring } = require('@polkadot/api')
const { encodeAddress } = require('@polkadot/util-crypto')
const { createWriteStream } = require('fs')
const BN = require('bn.js')
const fs = require('fs');

const endpoint = 'wss://nodes.mainnet.fractalprotocol.com';

const phrases = Object.fromEntries(
  fs.readFileSync(process.env.PHRASES_FILENAME, "utf-8").
  split(/\r?\n/).
  slice(0, -1).
  map(l => l.split(","))
);

const main = async () => {
  console.log(`Connecting to ${endpoint}...`)
  const provider = new WsProvider(endpoint)//, undefined, undefined, 10 * 1000)
  const substrate = await ApiPromise.create({ provider })
  await substrate.isReady
  const { chainDecimals } = substrate.registry

  const toUnit = (balance) => {
    base = new BN(10).pow(new BN(chainDecimals))
    dm = new BN(balance).divmod(base)
    return parseFloat(dm.div.toString() + '.' + dm.mod.toString())
  }

  const fileContents = fs.readFileSync(process.env.JSONS_FILENAME, "utf-8");
  const fileLines = fileContents.split(/\r?\n/).slice(0, -1);

  console.log();

  for (const line of fileLines) {
    const transfer = JSON.parse(line);

    const sender = transfer["signer"];

    let transferAmount = transfer["args"][1];
    transferAmount = typeof transferAmount === "string" ? new BN(transferAmount.slice(2), 16) : new BN(transferAmount, 10);

    const tmpAddress = transfer["args"][0]["id"];
    const tmpAccount = await substrate.query.system.account(tmpAddress);
    const tmpBalance = tmpAccount.data.free;

    console.log(
      tmpAccount.nonce.toHuman(), // possibly confusing because of account reaping, unsure if it resets to 0
      tmpAddress,
      toUnit(tmpBalance),
      toUnit(transferAmount),
      tmpBalance >= transferAmount,
    );

    if (tmpBalance === 0) { continue; }

    // FIXME: subtract extrinsic weight

    const tx = substrate.tx.balances.transfer(sender, tmpBalance);
    const keyring = new Keyring({ type: "sr25519" });
    if (phrases[tmpAddress]) {
      const signer = keyring.addFromUri(phrases[tmpAddress]);
      console.log(`Sending ${toUnit(tmpBalance)} FCL from ${tmpAddress} to ${sender}`);
      const txHash = await tx.signAndSend(signer);
      console.log(txHash);
    }

    console.log();
  };

  console.log('Substrate connection closed')
  await substrate.disconnect()
}

main().then().catch(console.error)
