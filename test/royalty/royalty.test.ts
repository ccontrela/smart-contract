import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { RoyaltyMock, RoyaltyMock__factory } from "../../typechain-types";

describe("Royalty", () => {
  let mock: MockContract<RoyaltyMock>;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  before(async () => {
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const mockFactory = await smock.mock<RoyaltyMock__factory>("RoyaltyMock");
    mock = await mockFactory.deploy();
    await mock.deployed();
    await mock.setRoyaltyReceiver(user1.address);
  });

  it("should support ERC2981 Interface", async () => {
    const ERC2981InterfaceId = "0x2a55205a"; // type(IERC2981).interfaceId

    expect(await mock.supportsInterface(ERC2981InterfaceId)).to.equal(true);
  });

  it("should get royalty receiver", async () => {
    expect(await mock.royaltyReceiver()).to.equal(user1.address);
  });

  it("should set royalty receiver", async () => {
    await expect(mock.setRoyaltyReceiver(user2.address)).to.not.be.reverted;
    expect(await mock.royaltyReceiver()).to.equal(user2.address);
  });

  it("should fail toset royalty receiver", async () => {
    await expect(
      mock.setRoyaltyReceiver(ethers.constants.AddressZero)
    ).to.be.revertedWithCustomError(mock, "ZeroAddressReceiver");
  });

  it("should set royalty basis points", async () => {
    await expect(mock.setRoyaltyBasisPoints("500")).to.not.be.reverted;
    expect(await mock.royaltyBasisPoints()).to.equal(500);
  });

  it("should fail to set royalty basis points", async () => {
    await expect(
      mock.setRoyaltyBasisPoints("15000")
    ).to.be.revertedWithCustomError(mock, "WrongRoyaltyBasisPoints");
  });

  it("should get valid royalty info", async () => {
    const tokenId = "1";
    await expect(mock.setRoyaltyBasisPoints("500")).to.not.be.reverted;

    const [royaltyReceiver, royaltyAmount] = await mock.royaltyInfo(
      tokenId,
      ethers.utils.parseEther("0.3")
    );
    expect(royaltyReceiver).to.equal(user1.address);
    expect(royaltyAmount).to.eq(ethers.utils.parseEther("0.015"));
  });
});
