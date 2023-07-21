import { expect } from "chai";
import { BigNumber } from "ethers";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

import {
  IERC165__factory,
  IERC20PreferredReturn__factory,
  IRecoupment__factory,
  PreferredReturnMock,
  PreferredReturnMock__factory,
  StandardERC20,
  StandardERC20__factory,
} from "../../typechain-types";
import { getInterfaceId } from "../utils";

describe("Preferred Return", () => {
  let mock: MockContract<PreferredReturnMock>;
  let standardERC20Mock: MockContract<StandardERC20>;
  let signer: SignerWithAddress;
  let noAllowance: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const tokenPrice: string = "120000"; // 0.0012 USDC

  const IERC165InterfaceId = getInterfaceId(IERC165__factory.createInterface());
  const IRecoupmentInterfaceId = getInterfaceId(
    IRecoupment__factory.createInterface()
  );
  const IERC20PreferredReturnInterfaceId = getInterfaceId(
    IERC20PreferredReturn__factory.createInterface()
  );

  before(async () => {
    [signer, noAllowance, user1, user2, user3] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const StandardERC20MockFactory = await smock.mock<StandardERC20__factory>(
      "StandardERC20"
    );
    standardERC20Mock = await StandardERC20MockFactory.deploy();
    await standardERC20Mock.deployed();

    await standardERC20Mock
      .connect(user1)
      .mint(ethers.utils.parseEther("6000"));
    await standardERC20Mock
      .connect(user2)
      .mint(ethers.utils.parseEther("5000"));

    const mockFactory = await smock.mock<PreferredReturnMock__factory>(
      "PreferredReturnMock"
    );
    mock = await mockFactory.deploy(
      "PreferredReturnToken",
      "PPT",
      standardERC20Mock.address,
      tokenPrice,
      1000 // 10% (fixed point 2)
    );
    await mock.deployed();

    await expect(
      standardERC20Mock
        .connect(user1)
        .approve(mock.address, ethers.utils.parseEther("6000"))
    ).to.be.not.reverted;

    await expect(
      standardERC20Mock
        .connect(user2)
        .approve(mock.address, ethers.utils.parseEther("5000"))
    ).to.be.not.reverted;
  });

  it("should support interface IERC165, IRecoupment & IERC20PreferredReturn", async () => {
    expect(await mock.supportsInterface("0x00000000")).to.be.false;
    expect(await mock.supportsInterface(IERC165InterfaceId)).to.be.true;
    expect(await mock.supportsInterface(IRecoupmentInterfaceId)).to.be.true;
    expect(await mock.supportsInterface(IERC20PreferredReturnInterfaceId)).to.be
      .true;
  });

  it("should get the return Basis Points", async () => {
    expect(await mock.connect(noAllowance).returnBasisPoints()).to.eq(1000);
  });

  it("should be successful for the investor to withdraw their preferred return", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(mock.close()).to.be.not.reverted;

    await expect(mock.withdraw()).to.emit(mock, "Withdraw");

    await standardERC20Mock.mint(ethers.utils.parseEther("2000"));

    expect(await standardERC20Mock.balanceOf(signer.address)).to.be.equal(
      ethers.utils.parseEther("7000")
    );

    const returnPercentage = (
      (await mock.returnBasisPoints()) as BigNumber
    ).add(BigNumber.from(10000));

    var balance = (await mock.balanceOf(user1.address)) as BigNumber;
    const totalRecoupment = ((await mock.totalSupply()) as BigNumber)
      .mul(BigNumber.from(tokenPrice))
      .div(BigNumber.from(10 ** 8))
      .mul(returnPercentage)
      .div(BigNumber.from(10000))
      .toString();

    var snapshot = [
      [user1.address, balance],
      [mock.address, totalRecoupment],
    ];
    var leaves = snapshot.map(([address, amount]) =>
      ethers.utils.solidityKeccak256(["address", "uint256"], [address, amount])
    );
    var merkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
    });

    var merkleRoot = merkleTree.getHexRoot();
    var depositProof = merkleTree.getHexProof(
      ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [mock.address, totalRecoupment]
      )
    );
    var withdrawProof = merkleTree.getHexProof(
      ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [user1.address, balance]
      )
    );

    await expect(
      mock.connect(user1).withdrawPref(withdrawProof, balance)
    ).to.be.revertedWithCustomError(mock, "FundingStatusRequired");

    await expect(
      standardERC20Mock.approve(mock.address, ethers.utils.parseEther("6000"))
    ).to.be.not.reverted;

    await expect(mock.depositPref(merkleRoot, depositProof)).to.emit(
      mock,
      "RecoupmentDeposit"
    );

    await expect(
      mock.connect(user1).withdrawPref(withdrawProof, balance)
    ).to.emit(mock, "RecoupmentWithdraw");

    await expect(
      mock.connect(user1).withdrawPref(withdrawProof, balance)
    ).to.be.revertedWithCustomError(mock, "RecoupmentWithdrawn");
  });

  it("should fail for the traded tokens owner to withdraw Prefs", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(
      mock.connect(user2).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(mock.close()).to.be.not.reverted;

    await expect(mock.withdraw()).to.emit(mock, "Withdraw");

    await standardERC20Mock.mint(ethers.utils.parseEther("2000"));

    await expect(
      standardERC20Mock.approve(mock.address, ethers.utils.parseEther("11000"))
    ).to.be.not.reverted;

    var user1Balance = await mock.balanceOf(user1.address);
    var user2Balance = await mock.balanceOf(user1.address);

    const returnPercentage = (
      (await mock.returnBasisPoints()) as BigNumber
    ).add(BigNumber.from(10000));

    const totalRecoupment = ((await mock.totalSupply()) as BigNumber)
      .mul(BigNumber.from(tokenPrice))
      .div(BigNumber.from(10 ** 8))
      .mul(returnPercentage)
      .div(BigNumber.from(10000))
      .toString();

    var snapshot = [
      [user1.address, user1Balance],
      [user2.address, user2Balance],
      [mock.address, totalRecoupment],
    ];
    var leaves = snapshot.map(([address, amount]) =>
      ethers.utils.solidityKeccak256(["address", "uint256"], [address, amount])
    );
    var merkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
    });

    var merkleRoot = merkleTree.getHexRoot();
    var depositProof = merkleTree.getHexProof(
      ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [mock.address, totalRecoupment]
      )
    );
    var user1Leaf = ethers.utils.solidityKeccak256(
      ["address", "uint256"],
      [user1.address, user1Balance]
    );
    var user1WithdrawProof = merkleTree.getHexProof(user1Leaf);
    // var user2WithdrawProof = merkleTree.getHexProof(
    //   ethers.utils.solidityKeccak256(
    //     ["address", "uint256"],
    //     [user2.address, user2Balance]
    //   )
    // );

    await expect(
      mock.depositPref(merkleRoot, user1WithdrawProof)
    ).to.be.revertedWithCustomError(mock, "ProofFailed");

    await expect(mock.depositPref(merkleRoot, depositProof)).to.emit(
      mock,
      "RecoupmentDeposit"
    );

    await expect(
      mock
        .connect(user1)
        .transfer(user3.address, ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(
      mock.connect(user3).withdrawPref(user1WithdrawProof, user1Balance)
    ).to.revertedWithCustomError(mock, "ProofFailed");

    expect(
      await mock.connect(user1).recoupmentWithdrawn(merkleRoot, user1Leaf)
    ).to.eq(false);

    await expect(
      mock.connect(user1).withdrawPref(user1WithdrawProof, user1Balance)
    ).to.emit(mock, "RecoupmentWithdraw");

    expect(
      await mock.connect(user1).recoupmentWithdrawn(merkleRoot, user1Leaf)
    ).to.eq(true);

    await expect(
      mock
        .connect(user1)
        .recoupmentWithdrawn(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          user1Leaf
        )
    ).to.be.revertedWithCustomError(mock, "InvalidMerkleRoot");
  });
});
