import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SaleStateMock, SaleStateMock__factory } from "../../typechain-types";

describe("Sale State", () => {
  let mock: MockContract<SaleStateMock>;

  beforeEach(async () => {
    const mockFactory = await smock.mock<SaleStateMock__factory>(
      "SaleStateMock"
    );
    mock = await mockFactory.deploy();
    await mock.deployed();
  });

  describe("Check setters and getters", async () => {
    it("should emit test when sale type is set", async () => {
      expect(await mock.setSaleType("TestSale"))
        .to.emit(mock, "TypeOfSale")
        .withArgs("TestSale");

      expect(await mock.getSaleType()).to.equal("TestSale");
    });

    it("should emit sale state when sale state is set", async () => {
      expect(await mock.setSaleState(0))
        .to.emit(mock, "StateOfSale")
        .withArgs(0);
    });

    it("should emit sale state finished", async () => {
      await expect(mock.setSaleState(3))
        .to.emit(mock, "TypeOfSale")
        .withArgs("Finished");

      await expect(mock.setSaleState(1)).to.be.revertedWithCustomError(
        mock,
        "AllSalesFinished"
      );

      await expect(mock.setSaleType("TestSale")).to.be.revertedWithCustomError(
        mock,
        "AllSalesFinished"
      );
    });

    it("should return last known sale state", async () => {
      expect(await mock.getSaleState()).to.equal(0);
    });
  });

  describe("Check test mint", async () => {
    it("should emit true when sale type is set", async () => {
      expect(await mock.setSaleType("TestSale"))
        .to.emit(mock, "TypeOfSale")
        .withArgs("TestSale");
      expect(await mock.setSaleState(1))
        .to.emit(mock, "StateOfSale")
        .withArgs(1);
      expect(await mock.getSaleState()).to.equal(1);
      expect(await mock.testMint("TestSale"))
        .to.emit(mock, "MintToken")
        .withArgs(true);
    });

    it("should revert when NoActiveSale", async () => {
      expect(await mock.setSaleState(0))
        .to.emit(mock, "StateOfSale")
        .withArgs(0);
      expect(await mock.getSaleState()).to.equal(0);
      expect(await mock.setSaleType("TestSale"))
        .to.emit(mock, "TypeOfSale")
        .withArgs("TestSale");
      await expect(mock.testMint("TestSale")).to.be.revertedWithCustomError(
        mock,
        "NoActiveSale"
      );
    });

    it("should revert when sale type is incorrect", async () => {
      expect(await mock.setSaleType("TestSale"))
        .to.emit(mock, "TypeOfSale")
        .withArgs("TestSale");
      expect(await mock.setSaleState(1))
        .to.emit(mock, "StateOfSale")
        .withArgs(1);
      expect(await mock.getSaleState()).to.equal(1);
      await expect(mock.testMint("NotASale")).to.be.revertedWithCustomError(
        mock,
        "IncorrectSaleType"
      );
    });

    it("should revert when paused", async () => {
      expect(await mock.setSaleState(1))
        .to.emit(mock, "StateOfSale")
        .withArgs(1);
      expect(await mock.getSaleState()).to.equal(1);
      expect(await mock.pause())
        .to.emit(mock, "IsPaused")
        .withArgs(true);
      await expect(mock.testMint("None")).to.be.revertedWithCustomError(
        mock,
        "NoActiveSale"
      );
    });

    it("should revert pausing when paused", async () => {
      expect(await mock.setSaleState(1))
        .to.emit(mock, "StateOfSale")
        .withArgs(1);
      expect(await mock.getSaleState()).to.equal(1);
      expect(await mock.pause())
        .to.emit(mock, "IsPaused")
        .withArgs(true);

      await expect(mock.pause()).to.be.revertedWithCustomError(
        mock,
        "NoActiveSale"
      );

      await expect(mock.unpause()).to.emit(mock, "IsPaused").withArgs(false);

      await expect(mock.unpause()).to.be.revertedWithCustomError(
        mock,
        "NoPausedSale"
      );
    });
  });
});
