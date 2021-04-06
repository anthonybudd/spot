const { hdkey } = require('ethereumjs-wallet')
const bip39 = require('bip39');
const Web3 = require('web3');


module.exports = function ETH() {

    // Default
    this.name = 'ethereum';
    this.coinType = 60;
    this.pathPrefix = `m/44'/${this.coinType}'/`

    // Extra
    this.web3;
    this.root;


    this.init = () => (new Promise(async (resolve, reject) => {
        var seed = await bip39.mnemonicToSeed(process.env.ETH_MNEMONIC);
        this.root = hdkey.fromMasterSeed(seed);

        this.web3 = new Web3(process.env.ETH_WEB3_PROVIDER);

        resolve(this);
    }))


    // Methods
    this.derivePath = (path) => (this.root.derivePath(this.pathPrefix.concat(path)));
    this.derivePathToAddress = (path) => (this.root.derivePath(this.pathPrefix.concat(path)).getWallet().getAddressString());

    this.getBalance = (address) => (this.web3.eth.getBalance(address));

    this.createTX = (args) => {

        var from = this.derivePathToAddress(args.fromPath);
        var to = this.derivePathToAddress(args.toPath);
        var value = args.amount;
        var gasPrice = args.gasPrice || 20000000000;

        return new Promise(async (resolve, reject) => {
            var tx = {
                from,
                to,
                gasPrice,
                data: "",
            }
            tx.gas = await this.web3.eth.estimateGas(tx);
            tx.value = (value - (tx.gas * gasPrice));

            const signedTransaction = await this.web3.eth.accounts.signTransaction(tx, this.derivePath(args.fromPath).getWallet().getPrivateKeyString());

            // // console.log(signedTransaction);

            this.web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
                .on('receipt', (r) => {
                    // console.log(r);
                    resolve(r);
                });
        })
    }
}