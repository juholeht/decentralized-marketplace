var Marketplace = artifacts.require("./Marketplace.sol");
var StringUtil = artifacts.require("./StringUtil.sol");

module.exports = function(deployer) {
  // deploy library and link it to Marketplace which
  // is the main contract.
  deployer.deploy(StringUtil);
  deployer.link(StringUtil, Marketplace);
  // Marketplace inherits from MarketplaceSecurity
  // so deploying Marketplace is enough
  deployer.deploy(Marketplace);
};
