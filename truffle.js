
//var HDWalletProvider = require("truffle-hdwallet-provider")

//var mnemonic = "put your own mnemonic here"
//var infura = "https://rinkeby.infura.io/v3/<id>"

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  contracts_build_directory: "./client/src/contracts",
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 5500000,
    }/*,
    rinkeby: {
        provider: new HDWalletProvider(mnemonic, infura),
        network_id: "4",
        gas: 5500000,
    }*/
  },
  solc: {
    optimizer: {
        enabled: true,
        runs: 200
    }
  }
};