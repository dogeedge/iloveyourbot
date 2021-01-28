const crypto = require('crypto');
const ethUtils = require('ethereumjs-util');
const Web3 = require('web3');

const ERRORS = {
    invalidHex: "Invalid hex input",
    invalidAddress: "Invalid address"
};
const getRandomWallet = function () {
    const randbytes = crypto.randomBytes(32);
    const address = '0x' + ethUtils.privateToAddress(randbytes).toString('hex');
    return {address: address, privKey: randbytes.toString('hex')}
};
const isValidHex = function (hex) {
    if (!hex.length) return true;
    hex = hex.toUpperCase();
    const re = /^[0-9A-F]+$/g;
    return re.test(hex);
};
const getDeterministicContractAddress = function (address) {
    return '0x' + ethUtils.sha3(ethUtils.rlp.encode([address, 0])).slice(12).toString('hex');
};
const isValidVanityWallet = function (wallet, input, isChecksum, isContract) {
    let _add = wallet.address;
    if (isContract) {
        let _contractAdd = getDeterministicContractAddress(_add);
        _contractAdd = isChecksum ? ethUtils.toChecksumAddress(_contractAdd) : _contractAdd;
        wallet.contract = _contractAdd;
        return _contractAdd.substr(2, input.length) == input
    }
    _add = isChecksum ? ethUtils.toChecksumAddress(_add) : _add;
    return _add.substr(2, input.length) == input;
};
const getVanityWallet = function (input = '', isChecksum = false, isContract = false, counter = function () {
}) {
    if (!isValidHex(input)) throw new Error(ERRORS.invalidHex);
    input = isChecksum ? input : input.toLowerCase();
    let _wallet = getRandomWallet();
    while (!isValidVanityWallet(_wallet, input, isChecksum, isContract)) {
        counter()
        _wallet = getRandomWallet(isChecksum);
    }
    if (isChecksum) _wallet.address = ethUtils.toChecksumAddress(_wallet.address);
    return _wallet;
};
const getWalletBalanceFactory = function(web3) {
    return function(address) {
        if (!ethUtils.isValidAddress(address)) throw new Error(ERRORS.invalidAddress);

        let balance = null;

        web3.eth.getBalance(address, function (err, result) {
            if (err) {
                balance = NaN;
            } else {
                balance = +web3.utils.fromWei(result, 'ether');
            }
        });

        while (balance === null) {
            // wait for balance
        }

        return balance;
    };
};

module.exports = function (web3Provider) {
    if (!(
        web3Provider instanceof Web3.providers.HttpProvider ||
        web3Provider instanceof Web3.providers.IpcProvider ||
        web3Provider instanceof Web3.providers.WebsocketProvider
    )) throw new TypeError('web3Provider is of invalid type');

    const web3 = new Web3(web3Provider)

    return {
        getVanityWallet,
        getWalletBalance: getWalletBalanceFactory(web3),
        isValidHex,
        ERRORS
    }
}
