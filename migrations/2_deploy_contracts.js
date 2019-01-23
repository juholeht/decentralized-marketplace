var Marketplace = artifacts.require("./Marketplace.sol");
var MarketplaceSecurity = artifacts.require("./MarketplaceSecurity.sol");
var StringUtil = artifacts.require("./StringUtil.sol");

module.exports = function(deployer) {
  //deployer.deploy(MarketplaceSecurity);
  deployer.deploy(Marketplace);
  //deployer.deploy(StringUtil);
};
