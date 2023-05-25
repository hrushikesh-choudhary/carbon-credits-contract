var CarbonCredits = artifacts.require("CarbonCredit");
module.exports = function(deployer) {
      deployer.deploy(CarbonCredits, "CarbonCredit", "CCNFT");
}