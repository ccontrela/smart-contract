import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import {
  ERC1155PreAuthorizeMock,
  ERC1155PreAuthorizeMock__factory,
  ProxyRegistryMock,
  ProxyRegistryMock__factory,
} from "../../typechain-types";

describe("ERC1155PreAuthorize", () => {
  let mock: MockContract<ERC1155PreAuthorizeMock>;
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

    const mockFactory = await smock.mock<ERC1155PreAuthorizeMock__factory>(
      "ERC1155PreAuthorizeMock"
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
    await mintRequest(signer, 10);
    await expect(
      mock
        .connect(signer)
        .safeTransferFrom(signer.address, user1.address, tokenId, 5, 0x0)
    ).to.not.be.reverted;
  });

  it("should be able to transfer tokens by approved operator", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, 10);
    await setApprovalRequest(signer, user1);
    await expect(
      mock
        .connect(user1)
        .safeTransferFrom(signer.address, user1.address, tokenId, 5, 0x0)
    ).to.not.be.reverted;
  });

  it("should be able to transfer tokens by authorized account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, 10);
    await expect(
      mock
        .connect(user1)
        .safeTransferFrom(signer.address, user1.address, tokenId, 5, 0x0)
    ).to.not.be.reverted;
  });

  it("should be able to transfer tokens by proxy account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, 10);
    await expect(
      mock
        .connect(proxyForSigner)
        .safeTransferFrom(signer.address, user1.address, tokenId, 5, 0x0)
    ).to.not.be.reverted;
  });

  it("should not be able to transfer tokens by non owner | approved operator | authorized account | proxy account", async () => {
    let tokenId: number = 1;
    await mintRequest(signer, 10);
    await expect(
      mock
        .connect(user2)
        .safeTransferFrom(signer.address, user1.address, tokenId, 5, 0x0)
    ).to.be.reverted;
  });

  it("should be able to burn tokens by owner", async () => {
    await mintRequest(signer, 10);
    await expect(mock.connect(signer).burn(signer.address, 5)).to.not.be
      .reverted;
  });

  it("should be able to burn tokens by approved operator", async () => {
    await mintRequest(signer, 10);
    await setApprovalRequest(signer, user1);
    await expect(mock.connect(user1).burn(signer.address, 5)).to.not.be
      .reverted;
  });

  it("should be able to burn tokens by authorized account", async () => {
    await mintRequest(signer, 10);
    await expect(mock.connect(user1).burn(signer.address, 5)).to.not.be
      .reverted;
  });

  it("should be able to burn tokens by proxy account", async () => {
    await mintRequest(signer, 10);
    await expect(mock.connect(proxyForSigner).burn(signer.address, 5)).to.not.be
      .reverted;
  });

  it("should not be able to burn tokens by non owner | approved operator | authorized account | proxy account", async () => {
    await mintRequest(signer, 10);
    await expect(mock.connect(user2).burn(signer.address, 5)).to.be.reverted;
  });
});
