const ganache = require('@celo/ganache-cli')
const glob = require('glob-fs')({
  gitignore: false,
})
const { exec, waitForPortOpen } = require('./lib/test-utils')
const minimist = require('minimist')
const network = require('./truffle-config.js').networks.development

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, 1000 * seconds))

// As documented https://circleci.com/docs/2.0/env-vars/#built-in-environment-variables
const isCI = process.env.CI === 'true'

// Migration overrides specifically for unit tests
const migrationOverrides = {
  downtimeSlasher: {
    slashableDowntime: 60, // epoch length is 100 for unit tests
  },
  election: {
    minElectableValidators: '10',
  },
  epochRewards: {
    frozen: false,
  },
  exchange: {
    frozen: false,
    minimumReports: 1,
  },
  goldToken: {
    frozen: false,
  },
  governanceApproverMultiSig: {
    signatories: [network.from],
    numRequiredConfirmations: 1,
    numInternalRequiredConfirmations: 1,
  },
  reserve: {
    initialBalance: 100000000,
    otherAddresses: ['0x7457d5E02197480Db681D3fdF256c7acA21bDc12'], // Add an arbitrary "otherReserveAddress" so that reserve spending can be tested.
  },
  reserveSpenderMultiSig: {
    signatories: [network.from],
    numRequiredConfirmations: 1,
    numInternalRequiredConfirmations: 1,
  },
  stableToken: {
    oracles: [network.from],
    frozen: false,
  },
}

async function startGanache() {
  const server = ganache.server({
    default_balance_ether: network.defaultBalance,
    network_id: network.network_id,
    mnemonic: network.mnemonic,
    gasPrice: network.gasPrice,
    gasLimit: 20000000,
    allowUnlimitedContractSize: true,
  })

  await new Promise((resolve, reject) => {
    server.listen(8545, (err, blockchain) => {
      if (err) {
        reject(err)
      } else {
        resolve(blockchain)
      }
    })
  })

  return () =>
    new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
}

async function test() {
  const argv = minimist(process.argv.slice(2), {
    boolean: ['gas', 'coverage', 'verbose-rpc'],
  })

  try {
    const closeGanache = await startGanache()
    if (isCI) {
      // If we are running on circle ci we need to wait for ganache to be up.
      await waitForPortOpen('localhost', 8545, 60)
    }

    let testArgs = ['run', 'truffle', 'test']
    if (argv['verbose-rpc']) {
      testArgs.push('--verbose-rpc')
    }
    if (argv.coverage) {
      testArgs = testArgs.concat(['--network', 'coverage'])
    }
    if (argv.gas) {
      testArgs = testArgs.concat(['--color', '--gas'])
    }
    // Add test specific migration overrides
    testArgs = testArgs.concat(['--migration_override', JSON.stringify(migrationOverrides)])

    const testGlob =
      argv._.length > 0
        ? argv._.map((testName) => `test/\*\*/${testName}.ts`).join(' ')
        : `test/\*\*/*.ts`
    const testFiles = glob.readdirSync(testGlob)
    if (testFiles.length === 0) {
      // tslint:disable-next-line: no-console
      console.error(`No test files matched with ${testGlob}`)
      process.exit(1)
    }
    testArgs = testArgs.concat(testFiles)

    await exec('yarn', testArgs)
    await closeGanache()
  } catch (e) {
    // tslint:disable-next-line: no-console
    console.error(e.stdout ? e.stdout : e)
    process.nextTick(() => process.exit(1))
  }
}

test()
