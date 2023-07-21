import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import {
  HoldersMock,
  HoldersMock__factory,
  StandardERC20,
  StandardERC20__factory,
  StandardERC721,
  StandardERC721__factory,
} from "../../typechain-types";

describe("Mint Holders", () => {
  let mock: MockContract<HoldersMock>;
  let standardERC721: MockContract<StandardERC721>;
  let standardERC20: MockContract<StandardERC20>;
  let signer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  before(async () => {
    [signer, user1, user2, user3] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const mockFactory = await smock.mock<HoldersMock__factory>("HoldersMock");
    mock = await mockFactory.deploy();
    await mock.deployed();

    const standardERC721Factory = await smock.mock<StandardERC721__factory>(
      "StandardERC721"
    );
    standardERC721 = await standardERC721Factory.deploy();
    await standardERC721.deployed();

    await standardERC721.connect(user1).mint("1");
    await standardERC721.connect(user1).mint("2");
    await standardERC721.connect(user1).mint("3");
    await standardERC721.connect(user2).mint("4");
    await standardERC721.connect(user2).mint("5");
    await standardERC721.connect(user2).mint("6");
    await standardERC721.connect(user3).mint("7");
    await standardERC721.connect(user3).mint("8");
    await standardERC721.connect(user3).mint("9");

    const standardERC20Factory = await smock.mock<StandardERC20__factory>(
      "StandardERC20"
    );
    standardERC20 = await standardERC20Factory.deploy();
    await standardERC20.deployed();
  });

  it("should set token Contract", async () => {
    await expect(mock.connect(signer).setTokenContract(standardERC721.address))
      .to.not.be.reverted;
  });

  it("should fail to set token Contract", async () => {
    await expect(
      mock.connect(signer).setTokenContract(standardERC20.address)
    ).to.not.be.revertedWithCustomError(mock, "UnsupportedContractAddress");
  });

  it("should mint holders mint", async () => {
    await expect(mock.connect(signer).setTokenContract(standardERC721.address))
      .to.not.be.reverted;

    await expect(mock.connect(user1).mint(["1", "2"])).to.emit(
      mock,
      "MintToken"
    );
    await expect(mock.connect(user2).mint(["4", "5"])).to.emit(
      mock,
      "MintToken"
    );
    await expect(mock.connect(user3).mint(["7", "8"])).to.emit(
      mock,
      "MintToken"
    );
  });

  it("should fail to mint holders due to not holding reported token", async () => {
    await expect(mock.connect(signer).setTokenContract(standardERC721.address))
      .to.not.be.reverted;

    await expect(mock.connect(user1).mint(["2", "5"]))
      .to.be.revertedWithCustomError(mock, "InvalidHolder")
      .withArgs("5", user1.address);
  });

  it("should mint holders with limited supply", async () => {
    await expect(mock.connect(signer).setTokenContract(standardERC721.address))
      .to.not.be.reverted;

    await expect(mock.connect(signer).setHoldersMintSupply("5")).to.not.be
      .reverted;

    await expect(mock.connect(user1).mint(["1", "2"])).to.emit(
      mock,
      "MintToken"
    );
    await expect(mock.connect(user2).mint(["4", "5"])).to.emit(
      mock,
      "MintToken"
    );

    await expect(
      mock.connect(user3).mint(["7", "8"])
    ).to.be.revertedWithCustomError(mock, "HoldersMintSoldOut");
  });

  it("should set a mint price", async () => {
    await expect(mock.connect(signer).setTokenContract(standardERC721.address))
      .to.not.be.reverted;

    await expect(mock.connect(signer).setHoldersMintSupply("5")).to.not.be
      .reverted;

    await expect(
      mock.connect(signer).setHoldersMintPrice(ethers.utils.parseEther("0.8"))
    ).to.not.be.reverted;
  });
});
