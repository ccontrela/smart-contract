import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import {
  WithdrawalSplitMock,
  WithdrawalSplitMock__factory,
} from "../../typechain-types";

describe("WithdrawalSplit", () => {
  let mock: MockContract<WithdrawalSplitMock>;
  let signer: SignerWithAddress;
  let user1: SignerWithAddress;

  before(async () => {
    [signer, user1] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const mockFactory = await smock.mock<WithdrawalSplitMock__factory>(
      "WithdrawalSplitMock"
    );
    mock = await mockFactory.deploy();
    await mock.deployed();
  });

  it("should not revert when owner call setBeneficiaries without zero address, zero basisPoints", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500, 500];

    await expect(mock.connect(signer).setBeneficiaries(wallets, basisPoints)).to
      .not.be.reverted;
  });

  it("should revert when user call setBeneficiaries without zero address, zero basisPoints", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500, 500];

    await expect(
      mock.connect(user1).setBeneficiaries(wallets, basisPoints)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should revert when owner call setBeneficiaries with zero address", async () => {
    const wallets = [
      "0x0000000000000000000000000000000000000000",
      signer.address,
    ];
    const basisPoints = [500, 500];

    await expect(
      mock.connect(signer).setBeneficiaries(wallets, basisPoints)
    ).to.be.revertedWithCustomError(mock, "ZeroBeneficiaryAddress");
  });

  it("should revert when user call setBeneficiaries with zero address", async () => {
    const wallets = [
      "0x0000000000000000000000000000000000000000",
      signer.address,
    ];
    const basisPoints = [500, 500];

    await expect(
      mock.connect(user1).setBeneficiaries(wallets, basisPoints)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should revert when owner call setBeneficiaries with zero basisPoints", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [0, 500];

    await expect(
      mock.connect(signer).setBeneficiaries(wallets, basisPoints)
    ).to.be.revertedWithCustomError(mock, "ZeroBeneficiaryBasisPoints");
  });

  it("should revert when user call setBeneficiaries with zero basisPoints", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [0, 500];

    await expect(
      mock.connect(user1).setBeneficiaries(wallets, basisPoints)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should revert when owner call setBeneficiaries with mismatched array lengths", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500];

    await expect(
      mock.connect(signer).setBeneficiaries(wallets, basisPoints)
    ).to.be.revertedWithCustomError(mock, "ArrayLengthMismatch");
  });

  it("should revert when user call setBeneficiaries with mismatched array lengths", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500];

    await expect(
      mock.connect(user1).setBeneficiaries(wallets, basisPoints)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should revert when signer call setBeneficiaries with zero length arrays", async () => {
    const wallets: any[] = [];
    const basisPoints: any[] = [];

    await expect(
      mock.connect(signer).setBeneficiaries(wallets, basisPoints)
    ).to.be.revertedWithCustomError(mock, "ZeroArrayLength");
  });

  it("should not revert when owner call withdrawEth,  contract have balance", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500, 500];
    await mock.connect(signer).setBeneficiaries(wallets, basisPoints);
    await expect(
      signer.sendTransaction({
        to: mock.address,
        value: ethers.utils.parseEther("100"),
      })
    ).to.not.be.reverted;
    await expect(mock.connect(signer).withdrawEth()).to.not.be.reverted;
  });

  it("should revert when user call withdrawEth,  contract have not balance", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500, 500];
    await mock.connect(signer).setBeneficiaries(wallets, basisPoints);
    await expect(mock.connect(signer).withdrawEth()).to.be.reverted;
  });

  it("should not revert when user call withdrawErc20,  contract have balance of ERC20.", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500, 500];
    const value = ethers.utils.parseEther("100");
    await mock.connect(signer).setBeneficiaries(wallets, basisPoints);
    await mock.connect(signer).mint(ethers.utils.parseEther("100"));
    await mock.connect(signer).transfer(mock.address, value);
    await expect(mock.connect(signer).withdrawErc20(mock.address)).to.not.be
      .reverted;
  });

  it("should revert when user call withdrawErc20,  contract have not balance of ERC20.", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500, 500];
    await mock.connect(signer).setBeneficiaries(wallets, basisPoints);
    await expect(mock.connect(signer).withdrawErc20(mock.address)).to.be
      .reverted;
  });

  it("should retrieve exact amount revert when user call withdrawErc20,  contract have balance of ERC20.", async () => {
    const wallets = [user1.address, signer.address];
    const basisPoints = [500, 500];
    const value = ethers.utils.parseEther("1");
    await mock.connect(signer).setBeneficiaries(wallets, basisPoints);
    await mock.connect(signer).mint(ethers.utils.parseEther("1"));
    await mock.connect(signer).transfer(mock.address, value);
    await mock.withdrawErc20(mock.address);
    expect(await mock.connect(signer).balanceOf(signer.address)).to.equal(
      "50000000000000000"
    );
  });
});
