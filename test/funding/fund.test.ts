import { expect } from "chai";
import { BigNumber } from "ethers";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import {
  FundMock,
  FundMock__factory,
  IERC165__factory,
  IERC20Fund__factory,
  IFund__factory,
  StandardERC20,
  StandardERC20__factory,
} from "../../typechain-types";
import { getInterfaceId } from "../utils";

describe("Fund", () => {
  let mock: MockContract<FundMock>;
  let standardERC20Mock: MockContract<StandardERC20>;
  let signer: SignerWithAddress;
  let noAllowance: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const tokenPrice: string = "120000"; // 0.0012 USDC

  const IERC165InterfaceId = getInterfaceId(IERC165__factory.createInterface());
  const IFundInterfaceId = getInterfaceId(IFund__factory.createInterface());
  const IERC20FundInterfaceId = getInterfaceId(
    IERC20Fund__factory.createInterface()
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

    const mockFactory = await smock.mock<FundMock__factory>("FundMock");
    mock = await mockFactory.deploy(
      "FundToken",
      "PPT",
      standardERC20Mock.address,
      tokenPrice
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

  it("should support interface IERC165, IFund & IERC20Fund", async () => {
    expect(await mock.supportsInterface("0x00000000")).to.be.false;
    expect(await mock.supportsInterface(IERC165InterfaceId)).to.be.true;
    expect(await mock.supportsInterface(IFundInterfaceId)).to.be.true;
    expect(await mock.supportsInterface(IERC20FundInterfaceId)).to.be.true;
  });

  it("should return tokenPrice", async () => {
    expect(await mock.tokenPrice()).to.eq(tokenPrice);
  });

  it("should fail for single investors to add round funds who hasn't given the contract an allowance", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(noAllowance).fund(ethers.utils.parseEther("1000"))
    ).to.be.revertedWithCustomError(mock, "InsufficientAllowance");
  });

  it("should be successful for single investors to add funds", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("1000"))
    ).to.emit(mock, "Transfer");

    expect(await mock.totalSupply()).to.be.equal(
      ethers.utils
        .parseEther("1000")
        .mul(BigNumber.from(10 ** 8))
        .div(BigNumber.from(tokenPrice))
    );
    expect(await mock.balanceOf(user1.address)).to.be.equal(
      ethers.utils
        .parseEther("1000")
        .mul(BigNumber.from(10 ** 8))
        .div(BigNumber.from(tokenPrice))
    );
  });

  it("should be successful for several investors to add funds", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("1000"))
    ).to.emit(mock, "Transfer");

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(
      mock.connect(user2).fund(ethers.utils.parseEther("2000"))
    ).to.emit(mock, "Transfer");

    const totalSupply = ethers.utils
      .parseEther("1000")
      .mul(BigNumber.from(10 ** 8))
      .div(BigNumber.from(tokenPrice))
      .add(
        ethers.utils
          .parseEther("5000")
          .mul(BigNumber.from(10 ** 8))
          .div(BigNumber.from(tokenPrice))
      )
      .add(
        ethers.utils
          .parseEther("2000")
          .mul(BigNumber.from(10 ** 8))
          .div(BigNumber.from(tokenPrice))
      );

    expect(await mock.totalSupply()).to.be.equal(totalSupply);
    expect(await mock.balanceOf(user1.address)).to.be.equal(
      ethers.utils
        .parseEther("1000")
        .mul(BigNumber.from(10 ** 8))
        .div(BigNumber.from(tokenPrice))
        .add(
          ethers.utils
            .parseEther("5000")
            .mul(BigNumber.from(10 ** 8))
            .div(BigNumber.from(tokenPrice))
        )
    );
    expect(await mock.balanceOf(user2.address)).to.be.equal(
      ethers.utils
        .parseEther("2000")
        .mul(BigNumber.from(10 ** 8))
        .div(BigNumber.from(tokenPrice))
    );
  });

  it("should be successful for the issuer to withdraw the fund", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(mock.close()).to.be.not.reverted;

    expect(await standardERC20Mock.balanceOf(mock.address)).to.be.equal(
      ethers.utils.parseEther("5000")
    );

    await expect(mock.withdraw()).to.emit(mock, "Withdraw");

    expect(await standardERC20Mock.balanceOf(mock.address)).to.be.equal(
      ethers.utils.parseEther("0")
    );

    expect(await standardERC20Mock.balanceOf(signer.address)).to.be.equal(
      ethers.utils.parseEther("5000")
    );

    expect(await mock.totalSupply()).to.be.equal(
      ethers.utils
        .parseEther("5000")
        .mul(BigNumber.from(10 ** 8))
        .div(BigNumber.from(tokenPrice))
    );

    expect(await mock.balanceOf(user1.address)).to.be.equal(
      ethers.utils
        .parseEther("5000")
        .mul(BigNumber.from(10 ** 8))
        .div(BigNumber.from(tokenPrice))
    );
  });

  it("should be successful for several investors to receive refunds on cancelled funding", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("1000"))
    ).to.emit(mock, "Transfer");

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(
      mock.connect(user2).fund(ethers.utils.parseEther("2000"))
    ).to.emit(mock, "Transfer");

    const user1Balance = await mock.balanceOf(user1.address);
    const user2Balance = await mock.balanceOf(user2.address);

    await expect(mock.connect(user1).refund()).to.be.reverted;

    await expect(mock.connect(signer).cancel()).to.not.be.reverted;

    await expect(mock.connect(user1).refund()).to.not.be.reverted;

    await expect(mock.connect(user2).refund()).to.not.be.reverted;

    const user1USDCRefundAmount = user1Balance
      .mul(BigNumber.from(tokenPrice))
      .div(BigNumber.from(10 ** 8));
    expect(await standardERC20Mock.balanceOf(user1.address)).to.eq(
      user1USDCRefundAmount
    );

    const user2USDCRefundAmount = user2Balance
      .mul(BigNumber.from(tokenPrice))
      .div(BigNumber.from(10 ** 8));
    expect(await standardERC20Mock.balanceOf(user2.address)).to.eq(
      ethers.utils.parseEther("3000").add(user2USDCRefundAmount)
    );

    expect(await standardERC20Mock.balanceOf(mock.address)).to.eq(
      ethers.utils
        .parseEther("8000")
        .sub(user1USDCRefundAmount)
        .sub(user2USDCRefundAmount)
    );
  });
});
