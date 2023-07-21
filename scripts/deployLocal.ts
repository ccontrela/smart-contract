import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import fs from "fs";
import hre, { ethers } from "hardhat";
import keccak256 from "keccak256";
import { PreferredReturnMock, StandardERC20 } from "../typechain";
import { contractDeployment, keypress, writeContractData } from "./utils";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "localhost";
const date = new Date().toJSON().replace(/-|:|T|\..*/g, "");
const dir = `deployment/${network}`;
const filename = `deployment-${date}.json`;

// const contractAdmin = {
//   address: "0x859010BaAD3E7f51A5EF1e43550056ea29542Fb0",
// };

//////////////////////////////////////////////////////////////////////////

async function main() {
  // Global(ish) vars
  const [contractDeployer, contractOwner, contractSigner] =
    await ethers.getSigners();
  await contractDeployer.getAddress().catch((e) => {
    console.log("\nERROR: Ledger needs to be unlocked\n");
    process.exit(1);
  });
  await contractDeployer.getChainId().catch((e) => {
    console.log("\nERROR: Open Etheruem app on the Ledger.\n");
    process.exit(1);
  });

  if (["hardhat", "localhost"].includes(network)) {
    const [testUser] = await ethers.getSigners();
    testUser.sendTransaction({
      to: await contractDeployer.getAddress(),
      value: ethers.utils.parseEther("200"),
    });
  }

  let initialBalance: BigNumber;
  let currentBalance: BigNumber;
  let erc20Contract: StandardERC20;
  let contract: PreferredReturnMock;

  console.log("***************************");
  console.log("*   Contract Deployment   *");
  console.log("***************************");
  console.log("\n");

  // Confirm Settings
  {
    console.log("Settings");
    console.log("Network:", network, settingsNetwork == network);
    console.log(
      "Contract Owner Address:",
      contractOwner.address,
      ethers.utils.isAddress(contractOwner.address)
    );
    console.log("\n");

    writeContractData(dir, filename, {
      date,
      network,
      contractOwnerAddress: contractOwner.address,
    });
  }

  // Confirm Deployer
  {
    initialBalance = await contractDeployer.getBalance();

    console.log("Deployment Wallet");
    console.log("Address:", await contractDeployer.getAddress());
    console.log("Chainid: ", await contractDeployer.getChainId());
    console.log("Balance:", ethers.utils.formatEther(initialBalance), "Ether");
    console.log("\n");

    writeContractData(dir, filename, {
      deployerAddress: await contractDeployer.getAddress(),
    });
  }

  // ERC20 Deployment
  {
    erc20Contract = (await contractDeployment(
      contractDeployer,
      "StandardERC20",
      "StandardERC20"
    )) as StandardERC20;

    writeContractData(dir, filename, {
      erc20Address: erc20Contract.address,
    });
  }

  // PreferredReturnMock Deployment
  {
    // string memory name_,
    // string memory symbol_,
    // uint256 tokenPrice_,
    // address erc20Token_
    const args = [
      "FundingToken",
      "FNDT",
      erc20Contract.address,
      100000000, // 1:1 (fixed point 8)
      1000, // 10% (fixed point 2)
    ];
    contract = (await contractDeployment(
      contractDeployer,
      "PreferredReturnMock",
      "PreferredReturnMock",
      args
    )) as PreferredReturnMock;

    writeContractData(dir, filename, {
      PreferredPayMockAddress: contract.address,
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
