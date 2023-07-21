import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { randomBytes } from "crypto";
import { SignatureMock, SignatureMock__factory } from "../../typechain-types";

describe("Signature", () => {
  let mock: MockContract<SignatureMock>;
  let signer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  before(async () => {
    [signer, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const mockFactory = await smock.mock<SignatureMock__factory>(
      "SignatureMock"
    );
    mock = await mockFactory.deploy();
    await mock.deployed();
    await mock.setSignerAddress(signer.address);
  });

  function signMintRequest(
    address: string,
    nonce: string,
    freeMint: number[],
    preSale: number[]
  ) {
    let hash = ethers.utils.solidityKeccak256(
      ["address", "string", "uint256[]", "uint256[]"],
      [address, nonce, freeMint, preSale]
    );

    return signer.signMessage(ethers.utils.arrayify(hash));
  }

  describe("Check signed mint", async () => {
    it("should revert when setting signer to zero address", async () => {
      await expect(
        mock.connect(signer).setSignerAddress(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(mock, "ZeroSignerAddress");
    });

    it("should return the correct signer address", async () => {
      expect(await mock.signerAddress()).to.eq(signer.address);
    });

    it("should emit true when signed properly", async () => {
      const freeMint = [0, 1, 2, 6, 8, 10, 16, 18, 25, 30, 31, 32];
      const preSale = [0, 1, 3, 6, 9, 10, 16, 20];

      let nonce = randomBytes(10).toString("hex");

      let apiSignature = await signMintRequest(
        user1.address,
        nonce,
        freeMint,
        preSale
      );

      expect(
        await mock
          .connect(user1)
          .testSignedMint(freeMint, preSale, nonce, apiSignature)
      )
        .to.emit(mock, "MintToken")
        .withArgs(true);
    });

    it("should revert when a hash is already used", async () => {
      const freeMint = [0, 1, 2, 6, 8, 10, 16, 18, 25, 30, 31, 32];
      const preSale = [0, 1, 3, 6, 9, 10, 16, 20];

      let nonce = randomBytes(10).toString("hex");

      let apiSignature = await signMintRequest(
        user1.address,
        nonce,
        freeMint,
        preSale
      );

      await expect(
        mock
          .connect(user1)
          .testSignedMint(freeMint, preSale, nonce, apiSignature)
      )
        .to.emit(mock, "MintToken")
        .withArgs(true);

      await expect(
        mock
          .connect(user1)
          .testSignedMint(freeMint, preSale, nonce, apiSignature)
      ).to.be.revertedWithCustomError(mock, "HashUsed");
    });

    it("should revert when a hash is already used", async () => {
      const freeMint = [0, 1, 2, 6, 8, 10, 16, 18, 25, 30, 31, 32];
      const preSale = [0, 1, 3, 6, 9, 10, 16, 20];

      let nonce = randomBytes(10).toString("hex");

      let apiSignature = await signMintRequest(
        user1.address,
        nonce,
        freeMint,
        preSale
      );

      await expect(
        mock
          .connect(user2)
          .testSignedMint(freeMint, preSale, nonce, apiSignature)
      ).to.be.revertedWithCustomError(mock, "SignatureFailed");
    });
  });
});
