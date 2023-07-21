import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import {
  PaymentMock,
  PaymentMock__factory,
  StandardERC20,
  StandardERC20__factory,
} from "../../typechain-types";
import { sign } from "crypto";

describe("Payment State", () => {
  let mock: MockContract<PaymentMock>;
  let erc20Mock: MockContract<StandardERC20>;
  let signer: SignerWithAddress;
  let user1: SignerWithAddress;

  before(async () => {
    [signer, user1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const erc20Factory = await smock.mock<StandardERC20__factory>(
      "StandardERC20"
    );
    erc20Mock = await erc20Factory.deploy();
    await erc20Mock.deployed();

    const mockFactory = await smock.mock<PaymentMock__factory>("PaymentMock");
    mock = await mockFactory.deploy(erc20Mock.address);
    await mock.deployed();
  });

  it("should revert  when owner call ethPaymentMultiple without eth", async () => {
    const price = "0.1";
    const _quantity = 1;
    await expect(
      mock
        .connect(signer)
        .ethPaymentMultiple(ethers.utils.parseEther(price), _quantity)
    ).to.be.reverted;
  });

  it("should revert  when user call ethPaymentMultiple without eth", async () => {
    const price = "0.1";
    const _quantity = 1;
    await expect(
      mock
        .connect(user1)
        .ethPaymentMultiple(ethers.utils.parseEther(price), _quantity)
    ).to.be.reverted;
  });

  it("should not revert  when owner call ethPaymentMultiple with exact eth", async () => {
    const price = "0.1";
    const _quantity = 1;
    await expect(
      mock
        .connect(signer)
        .ethPaymentMultiple(ethers.utils.parseEther(price), _quantity, {
          value: ethers.utils.parseEther(price),
        })
    ).to.not.be.reverted;
  });

  it("should not revert  when user call ethPaymentMultiple with exact eth", async () => {
    const price = "0.1";
    const _quantity = 1;
    await expect(
      mock
        .connect(user1)
        .ethPaymentMultiple(ethers.utils.parseEther(price), _quantity, {
          value: ethers.utils.parseEther(price),
        })
    ).to.not.be.reverted;
  });

  it("should revert  when owner call ethPayment without eth", async () => {
    const _quantity = 1;
    await expect(mock.connect(signer).ethPayment(_quantity)).to.be.reverted;
  });

  it("should revert  when user call ethPayment without eth", async () => {
    const _quantity = 1;
    await expect(mock.connect(user1).ethPayment(_quantity)).to.be.reverted;
  });

  it("should not revert  when owner call ethPayment with eth", async () => {
    await expect(
      mock.connect(signer).ethPayment(ethers.utils.parseEther("0.1"), {
        value: ethers.utils.parseEther("0.1"),
      })
    ).to.not.be.reverted;
  });
  //////////////////////
  it("should revert  when owner call erc20PaymentMultiple without eth", async () => {
    const price = "0.1";
    const _quantity = 1;
    await expect(
      mock
        .connect(signer)
        .erc20PaymentMultiple(ethers.utils.parseEther(price), _quantity)
    ).to.be.revertedWithCustomError(mock, "Erc20InsufficientAllowance");
  });

  it("should revert  when user call erc20PaymentMultiple without eth", async () => {
    const price = "0.1";
    const _quantity = 1;
    await expect(
      mock
        .connect(user1)
        .erc20PaymentMultiple(ethers.utils.parseEther(price), _quantity)
    ).to.be.revertedWithCustomError(mock, "Erc20InsufficientAllowance");
  });

  it("should not revert  when owner call erc20PaymentMultiple with exact allowance", async () => {
    const price = "0.1";
    const _quantity = 1;

    await expect(erc20Mock.connect(signer).mint(ethers.utils.parseEther(price)))
      .to.not.be.reverted;

    await expect(
      erc20Mock
        .connect(signer)
        .approve(mock.address, ethers.utils.parseEther(price))
    ).to.not.be.reverted;

    await expect(
      mock
        .connect(signer)
        .erc20PaymentMultiple(ethers.utils.parseEther(price), _quantity)
    ).to.not.be.reverted;
  });

  it("should not revert  when user call erc20PaymentMultiple with exact allowance", async () => {
    const price = "0.1";
    const _quantity = 1;

    await expect(erc20Mock.connect(user1).mint(ethers.utils.parseEther(price)))
      .to.not.be.reverted;

    await expect(
      erc20Mock
        .connect(user1)
        .approve(mock.address, ethers.utils.parseEther(price))
    ).to.not.be.reverted;

    await expect(
      mock
        .connect(user1)
        .erc20PaymentMultiple(ethers.utils.parseEther(price), _quantity)
    ).to.not.be.reverted;
  });

  it("should revert  when owner call erc20Payment without allowance", async () => {
    const price = "0.1";

    await expect(
      mock.connect(signer).erc20Payment(ethers.utils.parseEther(price))
    ).to.be.revertedWithCustomError(mock, "Erc20InsufficientAllowance");
  });

  it("should revert  when user call erc20Payment without allowance", async () => {
    const price = "0.1";
    await expect(
      mock.connect(user1).erc20Payment(ethers.utils.parseEther(price))
    ).to.be.revertedWithCustomError(mock, "Erc20InsufficientAllowance");
  });

  it("should not revert  when owner call erc20Payment with allowance", async () => {
    const price = "0.1";

    await expect(erc20Mock.connect(signer).mint(ethers.utils.parseEther(price)))
      .to.not.be.reverted;

    await expect(
      erc20Mock
        .connect(signer)
        .approve(mock.address, ethers.utils.parseEther(price))
    ).to.not.be.reverted;

    await expect(
      mock.connect(signer).erc20Payment(ethers.utils.parseEther(price))
    ).to.not.be.reverted;
  });
});
