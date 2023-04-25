const { ethers, getNamedAccounts } = require("hardhat");
const {getWeth, AMOUNT} = require("../scripts/getWeth")

async function main() {
await getWeth()

deployer = (await getNamedAccounts()).deployer
const lendingPool = await getLendingPool(deployer)
console.log(`lendingPoolAddress ${lendingPool.address}`)

const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
console.log("Depositing.....")
await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
console.log("Deposited!")

let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
  lendingPool,
  deployer
);

const daiPrice = await getDaiPrice()
const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1/daiPrice.toNumber())
console.log(`you can borrow ${amountDaiToBorrow} worth of Dai`)
const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
const DaiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
await borrowDai(DaiAddress, lendingPool, amountDaiToBorrowWei, deployer)
console.log("You have borrowed!")


await getBorrowUserData(lendingPool, deployer)

await repay(amountDaiToBorrowWei, DaiAddress, lendingPool, deployer)
console.log("You have paid the borrowed amount")

await getBorrowUserData(lendingPool, deployer)

}
//0x773616E4d11A78F511299002da57A0a94577F1f4 (DAI/ETH Mainnet)

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
  const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 1, 0, account)
  await borrowTx.wait(1)


}



async function getLendingPool(account){
    const lendingPoolAddressProvider = await ethers.getContractAt(
      "ILendingPoolAddressesProvider",
      "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5", account
    );
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool()

    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)

    return lendingPool


}


async function approveERC20(erc20Address, spenderAddress, amountToSpend, account){
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    await tx.wait(1)
    console.log("approved")
}

async function getBorrowUserData(lendingPool, account){
    const {totalCollateralETH, totalDebtETH, availableBorrowsETH} = await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of eth deposited`)
     console.log(`You have ${totalDebtETH} borrowed ETH`);
      console.log(`You have ${availableBorrowsETH} worth of ETH to borrow`);

      return {availableBorrowsETH, totalDebtETH}
}
async function repay(amount, daiAddress, lendingPool, account){
  await approveERC20(daiAddress, lendingPool.address, amount, account)
  const repayTx = await lendingPool.repay(daiAddress, amount, 1 , account)
  await repayTx.wait(1)
}

async function getDaiPrice(){
    const daiETHPriceFeed = await ethers.getContractAt(
      "AggregatorV3Interface",
      "0x773616E4d11A78F511299002da57A0a94577F1f4"
    )

    const daiPrice = (await daiETHPriceFeed.latestRoundData())[1]
    console.log(`The current price of eth in terms of dai is ${daiPrice.toString()}`)
    return daiPrice

    ;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });