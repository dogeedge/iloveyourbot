#! /usr/bin/env node

const VanityEth = require('./libs/VanityEth');
const Web3 = require('web3');
const ora = require('ora');
const cluster = require('cluster');
const TimeFormat = require('hh-mm-ss');
const numCPUs = require('os').cpus().length;
const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .example('$0 -checksum -i B00B5', 'get a wallet where address matches B00B5 in checksum format')
    .example('$0 --contract -i ABC', 'get a wallet where 0 nonce contract address matches the vanity')
    .example('$0 -n 25 -i ABC', 'get 25 vanity wallets')
    .example('$0 -n 1000', 'get 1000 random wallets')
    .example('$0 --hunt', 'find wallets with balance')

    .alias('i', 'input')
    .string('i')
    .describe('i', 'input hex string')

    .alias('c', 'checksum')
    .boolean('c')
    .describe('c', 'check against the checksum address')

    .alias('n', 'count')
    .number('n')
    .describe('n', 'number of wallets')

    .boolean('contract')
    .describe('contract', 'contract address for contract deployment')

    .boolean('hunt')
    .describe('find wallets with balance')

    .alias('f', 'forever')
    .boolean('f')
    .describe('f', 'generate/hunt addresses without limit')

    .alias('l', 'log')
    .boolean('l')
    .describe('l', 'log output to file')

    .help('h')
    .alias('h', 'help')

    .epilog('copyright 2018')
    .argv;

let vanity = VanityEth(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/a29311a4546b4186affbe268fe84ebd3'));

if (cluster.isMaster) {
    const args = {
        input: argv.input ? argv.input : '',
        isChecksum: argv.checksum ? true : false,
        numWallets: argv.forever ? Infinity : (argv.count ? argv.count : 1),
        isContract: argv.contract ? true : false,
        hunt: argv.hunt ? true : false,
        log: argv.log ? true : false,
        logFname: argv.log ? 'VanityEth-log-' + Date.now() + '.txt' : ''
    }

    if (!vanity.isValidHex(args.input)) {
        console.error(args.input + ' is not valid hexadecimal');
        process.exit(1);
    }
    if (args.log) {
        const fs = require('fs');
        console.log('logging into ' + args.logFname);
        var logStream = fs.createWriteStream(args.logFname, {'flags': 'a'});
    }
    let walletsFound = 0;
    const spinner = ora(`${args.hunt ? 'hunting' : 'generating'} vanity address 1/${args.numWallets}`).start();
    let addps = 0;
    !args.hunt && setInterval(function () {
        spinner.text = 'Approximate ETA for an account ' + TimeFormat.fromS((Math.pow(16, 20) / Math.pow(16, 20 - args.input.length)) / addps, 'hh:mm:ss');
        addps = 0;
    }, 1000)
    for (let i = 0; i < numCPUs; i++) {
        const worker_env = {
            input: args.input,
            isChecksum: args.isChecksum,
            isContract: args.isContract,
            hunt: args.hunt
        }
        proc = cluster.fork(worker_env);
        proc.on('message', function (message) {
            if (message.balance) {
                spinner.succeed(JSON.stringify(message));
                if (args.log) logStream.write(JSON.stringify(message) + "\n");
                walletsFound++;
                if (walletsFound >= args.numWallets) {
                    cleanup();
                }
                spinner.text = 'hunting vanity address ' + (walletsFound + 1) + '/' + args.numWallets;
                spinner.start();
            }
            else if (message.account) {
                spinner.succeed(JSON.stringify(message));
                if (args.log) logStream.write(JSON.stringify(message) + "\n");
                walletsFound++;
                if (walletsFound >= args.numWallets) {
                    cleanup();
                }
                spinner.text = 'generating vanity address ' + (walletsFound + 1) + '/' + args.numWallets;
                spinner.start();
            } else if (message.counter) {
                addps++
            }
        });
    }

} else {
    const worker_env = process.env;

    if (worker_env.hunt == 'true') while (true) {
        const account = vanity.getVanityWallet(worker_env.input, worker_env.isChecksum == 'true', worker_env.isContract == 'true', function () {
            process.send({
                counter: true
            })
        });
        const balance = vanity.getWalletBalance(account.address);

        if (balance > 0) process.send({
            account: account,
            balance: balance
        })
    }
    else while (true) process.send({
        account: vanity.getVanityWallet(worker_env.input, worker_env.isChecksum == 'true', worker_env.isContract == 'true', function () {
            process.send({
                counter: true
            })
        })
    })
}
process.stdin.resume();
var cleanup = function (options, err) {
    if (err) console.log(err.stack);
    for (let id in cluster.workers) cluster.workers[id].process.kill();
    process.exit();
}
process.on('exit', cleanup.bind(null, {}));
process.on('SIGINT', cleanup.bind(null, {}));
process.on('uncaughtException', cleanup.bind(null, {}));
