import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import {
  ERC721PreAuthorizeMock,
  ERC721PreAuthorizeMock__factory,
  ProxyRegistryMock,
  ProxyRegistryMock__factory,
} from "../../typechain-types";

describe("ERC721PreAuthorize", () => {
  let mock: MockContract<ERC721PreAuthorizeMock>;
  let mockProxyRegistry: MockContract<ProxyRegistryMock>;
  let signer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let proxyForSigner: SignerWithAddress;

  before(async () => {
    [signer, user1, user2, proxyForSigner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const mockProxyFactory = await smock.mock<ProxyRegistryMock__factory>(
      "ProxyRegistryMock"
    );
    mockProxyRegistry = await mockProxyFactory.deploy();
    await mockProxyRegistry.deployed();
    await mockProxyRegistry.setProxy(signer.address, proxyForSigner.address);

    const mockFactory = await smock.mock<ERC721PreAuthorizeMock__factory>(
      "ERC721PreAuthorizeMock"
    );
    mock = await mockFactory.deploy(
      [signer.address, user1.address],
      mockProxyRegistry.address
    );
    await mock.deployed();
  });

  function mintRequest(minter: SignerWithAddress, amount: number) {
    mock.connect(minter).mint(amount);
  }

  function setApprovalRequest(
    owner: SignerWithAddress,
    operator: SignerWithAddress
  ) {
    mock.connect(owner).setApprovalForAll(operator.address, true);
  }

  it("should be able to transfer tokens by owner", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await expect(
      mock.connect(signer).transferFrom(signer.address, user1.address, tokenId)
    ).to.not.be.reverted;
  });

  it("should be able to transfer tokens by approved operator", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await setApprovalRequest(signer, user1);
    await expect(
      mock.connect(user1).transferFrom(signer.address, user1.address, tokenId)
    ).to.not.be.reverted;
  });

  it("should be able to transfer tokens by authorized account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await expect(
      mock.connect(user1).transferFrom(signer.address, user1.address, tokenId)
    ).to.not.be.reverted;
  });

  it("should be able to transfer tokens by proxy account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await expect(
      mock
        .connect(proxyForSigner)
        .transferFrom(signer.address, user1.address, tokenId)
    ).to.not.be.reverted;
  });

  it("should not be able to transfer tokens by non owner | approved operator | authorized account | proxy account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await expect(
      mock.connect(user2).transferFrom(signer.address, user1.address, tokenId)
    ).to.be.reverted;
  });

  it("should be able to burn tokens by owner", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await expect(mock.connect(signer).burn(tokenId)).to.not.be.reverted;
  });

  it("should be able to burn tokens by approved operator", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await setApprovalRequest(signer, user1);
    await expect(mock.connect(user1).burn(tokenId)).to.not.be.reverted;
  });

  it("should be able to burn tokens by authorized account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await expect(mock.connect(user1).burn(tokenId)).to.not.be.reverted;
  });

  it("should be able to burn tokens by proxy account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await expect(mock.connect(proxyForSigner).burn(tokenId)).to.not.be.reverted;
  });

  it("should not be able to burn tokens by non owner | approved operator | authorized account | proxy account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, tokenId);
    await expect(mock.connect(user2).burn(tokenId)).to.be.reverted;
  });
});
