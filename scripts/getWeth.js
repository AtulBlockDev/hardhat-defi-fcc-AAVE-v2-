const { ethers } = require("hardhat")

 const AMOUNT = ethers.utils.parseEther("0.1"); 

async function getWeth(){

    deployer = (await getNamedAccounts()).deployer

    const IWeth = await ethers.getContractAt(
      "IWeth",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", deployer
    );

    const tx = await IWeth.deposit({value: AMOUNT})
    await tx.wait(1)
    const wethBalance = await IWeth.balanceOf(deployer)
    console.log(`GOT ${wethBalance.toString()} WETH`)




}

module.exports = {
    getWeth,
    AMOUNT
}
