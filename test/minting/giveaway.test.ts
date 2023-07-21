import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { GiveawayMock, GiveawayMock__factory } from "../../typechain-types";

describe("Mint Giveaway", () => {
  let mock: MockContract<GiveawayMock>;
  let signer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  before(async () => {
    [signer, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const mockFactory = await smock.mock<GiveawayMock__factory>("GiveawayMock");
    mock = await mockFactory.deploy();
    await mock.deployed();
  });

  it("should giveaway mint", async () => {
    await expect(mock.connect(signer).giveaway([user1.address], ["1"])).to.emit(
      mock,
      "MintToken"
    );
  });

  it("should fail to giveaway mint due to array length mismatch", async () => {
    await expect(
      mock.connect(signer).giveaway([user1.address], ["1", "1"])
    ).to.be.revertedWithCustomError(mock, "GiveawayArrayLengthMismatch");
    await expect(
      mock.connect(signer).giveaway([user1.address, user2.address], ["1"])
    ).to.be.revertedWithCustomError(mock, "GiveawayArrayLengthMismatch");
  });

  it("should fail to giveaway mint due to empty to argument", async () => {
    await expect(
      mock.connect(signer).giveaway([], [])
    ).to.be.revertedWithCustomError(mock, "ZeroGiveawayArrayLength");
  });

  it("should fail to giveaway mint due to empty to zero quantity", async () => {
    await expect(
      mock.connect(signer).giveaway([user1.address, user2.address], ["1", "0"])
    ).to.be.revertedWithCustomError(mock, "ZeroQuantityGiveawayMint");
  });

  it("should fail to giveaway mint due to zero address", async () => {
    await expect(
      mock
        .connect(signer)
        .giveaway([user1.address, ethers.constants.AddressZero], ["1", "1"])
    ).to.be.revertedWithCustomError(mock, "ZeroAddressGiveawayMint");
  });
});
