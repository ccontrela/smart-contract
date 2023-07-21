import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

import {
  CarryMock,
  CarryMock__factory,
  IERC165__factory,
  IERC20Carry__factory,
  IRecoupment__factory,
  StandardERC20,
  StandardERC20__factory,
} from "../../typechain-types";
import { getInterfaceId } from "../utils";

describe("Carry", () => {
  let mock: MockContract<CarryMock>;
  let standardERC20Mock: MockContract<StandardERC20>;
  let signer: SignerWithAddress;
  let noAllowance: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const tokenPrice: string = "120000"; // 0.0012 USDC

  const IERC165InterfaceId = getInterfaceId(IERC165__factory.createInterface());
  const IRecoupmentInterfaceId = getInterfaceId(
    IRecoupment__factory.createInterface()
  );
  const IERC20CarryInterfaceId = getInterfaceId(
    IERC20Carry__factory.createInterface()
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

    const mockFactory = await smock.mock<CarryMock__factory>("CarryMock");
    mock = await mockFactory.deploy(
      "CarryToken",
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

  it("should support interface IERC165, IRecoupment & IERC20Carry", async () => {
    expect(await mock.supportsInterface("0x00000000")).to.be.false;
    expect(await mock.supportsInterface(IERC165InterfaceId)).to.be.true;
    expect(await mock.supportsInterface(IRecoupmentInterfaceId)).to.be.true;
    expect(await mock.supportsInterface(IERC20CarryInterfaceId)).to.be.true;
  });

  it("should be successful for the investor to withdraw their carry", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(mock.close()).to.be.not.reverted;

    await expect(mock.withdraw()).to.emit(mock, "Withdraw");

    await standardERC20Mock.mint(ethers.utils.parseEther("2000"));

    expect(await standardERC20Mock.balanceOf(signer.address)).to.be.equal(
      ethers.utils.parseEther("7000")
    );

    var balance = await mock.balanceOf(user1.address);

    var snapshot = [
      [user1.address, balance],
      [mock.address, ethers.utils.parseEther("5500")],
    ];
    var leaves = snapshot.map(([address, amount]) =>
      ethers.utils.solidityKeccak256(["address", "uint256"], [address, amount])
    );
    var merkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
    });

    var merkleRoot = merkleTree.getHexRoot();
    var depositProof = merkleTree.getHexProof(
      ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [mock.address, ethers.utils.parseEther("5500")]
      )
    );
    var withdrawProof = merkleTree.getHexProof(
      ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [user1.address, balance]
      )
    );

    await expect(
      mock.connect(user1).withdrawCarry(merkleRoot, withdrawProof, balance)
    ).to.be.revertedWithCustomError(mock, "FundingStatusRequired");

    await expect(
      standardERC20Mock.approve(mock.address, ethers.utils.parseEther("6000"))
    ).to.be.not.reverted;

    await expect(
      mock.depositCarry(
        merkleRoot,
        depositProof,
        ethers.utils.parseEther("5500")
      )
    ).to.emit(mock, "RecoupmentDeposit");

    await expect(
      mock.connect(user1).withdrawCarry(merkleRoot, withdrawProof, balance)
    ).to.emit(mock, "RecoupmentWithdraw");

    await expect(
      mock.connect(user1).withdrawCarry(merkleRoot, withdrawProof, balance)
    ).to.be.revertedWithCustomError(mock, "RecoupmentWithdrawn");
  });

  it("should fail for the traded tokens owner to withdraw carries", async () => {
    await expect(mock.open()).to.be.not.reverted;

    await expect(
      mock.connect(user1).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(
      mock.connect(user2).fund(ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(mock.close()).to.be.not.reverted;

    await expect(mock.withdraw()).to.emit(mock, "Withdraw");

    await standardERC20Mock.mint(ethers.utils.parseEther("2000"));

    await expect(
      standardERC20Mock.approve(mock.address, ethers.utils.parseEther("11000"))
    ).to.be.not.reverted;

    var user1Balance = await mock.balanceOf(user1.address);
    var user2Balance = await mock.balanceOf(user1.address);

    var snapshot = [
      [user1.address, user1Balance],
      [user2.address, user2Balance],
      [mock.address, ethers.utils.parseEther("11000")],
    ];
    var leaves = snapshot.map(([address, amount]) =>
      ethers.utils.solidityKeccak256(["address", "uint256"], [address, amount])
    );
    var merkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
    });

    var merkleRoot = merkleTree.getHexRoot();
    var depositProof = merkleTree.getHexProof(
      ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [mock.address, ethers.utils.parseEther("11000")]
      )
    );
    var user1WithdrawProof = merkleTree.getHexProof(
      ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [user1.address, user1Balance]
      )
    );
    // var user2WithdrawProof = merkleTree.getHexProof(
    //   ethers.utils.solidityKeccak256(
    //     ["address", "uint256"],
    //     [user2.address, user2Balance]
    //   )
    // );

    await expect(
      mock.depositCarry(
        merkleRoot,
        depositProof,
        ethers.utils.parseEther("11000")
      )
    ).to.emit(mock, "RecoupmentDeposit");

    await expect(
      mock
        .connect(user1)
        .transfer(user3.address, ethers.utils.parseEther("5000"))
    ).to.emit(mock, "Transfer");

    await expect(
      mock
        .connect(user3)
        .withdrawCarry(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          user1WithdrawProof,
          user1Balance
        )
    ).to.revertedWithCustomError(mock, "CannotBePreferredReturn");

    await expect(
      mock
        .connect(user3)
        .withdrawCarry(
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          user1WithdrawProof,
          user1Balance
        )
    ).to.revertedWithCustomError(mock, "InvalidMerkleRoot");

    await expect(
      mock
        .connect(user3)
        .withdrawCarry(merkleRoot, user1WithdrawProof, user1Balance)
    ).to.revertedWithCustomError(mock, "ProofFailed");

    await expect(
      mock
        .connect(user1)
        .withdrawCarry(merkleRoot, user1WithdrawProof, user1Balance)
    ).to.emit(mock, "RecoupmentWithdraw");
  });
});
