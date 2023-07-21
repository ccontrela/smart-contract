import { expect } from "chai";
import { MockContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import {
  AdminPermissionMock,
  AdminPermissionMock__factory,
} from "../../typechain-types";

describe("AdminPermission", () => {
  let mock: MockContract<AdminPermissionMock>;
  let signer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let DEFAULT_ADMIN_ROLE: string;
  let MODERATOR_ROLE: string;

  before(async () => {
    [signer, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    const mockFactory = await smock.mock<AdminPermissionMock__factory>(
      "AdminPermissionMock"
    );
    mock = await mockFactory.deploy();
    await mock.deployed();

    DEFAULT_ADMIN_ROLE = await mock.DEFAULT_ADMIN_ROLE();
    MODERATOR_ROLE = await mock.MODERATOR_ROLE();
  });

  it("should not revert when  owner call setAdminPermission without zero address", async () => {
    await expect(mock.connect(signer).setAdminPermission(user1.address)).to.not
      .be.reverted;
  });

  it("should revert when  user call setAdminPermission without zero address", async () => {
    await expect(mock.connect(user1).setAdminPermission(user1.address)).to.be
      .reverted;
  });

  it("should revert when  owner call setAdminPermission with zero address", async () => {
    const address = "0x0000000000000000000000000000000000000000";

    await expect(mock.connect(signer).setAdminPermission(address)).to.be
      .reverted;
  });

  it("should revert when  user call setAdminPermission with zero address", async () => {
    const address = "0x0000000000000000000000000000000000000000";

    await expect(mock.connect(user1).setAdminPermission(address)).to.be
      .reverted;
  });

  it("should not revert when owner call removeAdminPermission without zero address", async () => {
    await expect(mock.connect(signer).removeAdminPermission(user1.address)).to
      .not.be.reverted;
  });

  it("should revert when user call removeAdminPermission without zero address", async () => {
    await expect(mock.connect(user1).removeAdminPermission(user1.address)).to.be
      .reverted;
  });

  it("should revert when owner call removeAdminPermission with zero address", async () => {
    const address = "0x0000000000000000000000000000000000000000";
    await expect(mock.connect(signer).removeAdminPermission(address)).to.be
      .reverted;
  });

  it("should revert when user call removeAdminPermission with zero address", async () => {
    const address = "0x0000000000000000000000000000000000000000";
    await expect(mock.connect(user1).removeAdminPermission(address)).to.be
      .reverted;
  });

  it("should emit MintEvent when user calls mint with MODERATOR_ROLE", async () => {
    await expect(
      mock.connect(signer).grantRole(MODERATOR_ROLE, user1.address)
    ).to.emit(mock, "RoleGranted");

    await expect(mock.connect(user1).mint()).to.emit(mock, "MintEvent");
  });

  it("should emit OwnershipTransferred when user calls transferOwnership as owner", async () => {
    await expect(mock.connect(signer).transferOwnership(user1.address)).to.emit(
      mock,
      "OwnershipTransferred"
    );

    await expect(mock.connect(signer).grantRole(MODERATOR_ROLE, user1.address))
      .to.be.reverted;
  });

  it("should revert when user calls transferOwnership as user", async () => {
    await expect(mock.connect(user1).transferOwnership(user1.address)).to.be
      .reverted;
  });

  it("should revert after OwnershipTransferred when user calls grantRole as old owner", async () => {
    await expect(
      mock.connect(signer).grantRole(MODERATOR_ROLE, user1.address)
    ).to.emit(mock, "RoleGranted");

    await expect(mock.connect(signer).transferOwnership(user1.address)).to.emit(
      mock,
      "OwnershipTransferred"
    );

    await expect(mock.connect(signer).grantRole(MODERATOR_ROLE, user2.address))
      .to.be.reverted;
  });

  it("should emit MintEvent when user calls mint with MODERATOR_ROLE", async () => {
    await expect(
      mock.connect(signer).grantRole(MODERATOR_ROLE, user1.address)
    ).to.emit(mock, "RoleGranted");

    await expect(mock.connect(user1).mint()).to.emit(mock, "MintEvent");
  });

  it("should emit OwnershipTransferred when user calls transferOwnership as owner", async () => {
    await expect(mock.connect(signer).transferOwnership(user1.address)).to.emit(
      mock,
      "OwnershipTransferred"
    );

    await expect(mock.connect(signer).grantRole(MODERATOR_ROLE, user1.address))
      .to.be.reverted;
  });

  it("should revert when user calls transferOwnership as user", async () => {
    await expect(mock.connect(user1).transferOwnership(user1.address)).to.be
      .reverted;
  });

  it("should revert after OwnershipTransferred when user calls grantRole as old owner", async () => {
    await expect(
      mock.connect(signer).grantRole(MODERATOR_ROLE, user1.address)
    ).to.emit(mock, "RoleGranted");

    await expect(mock.connect(signer).transferOwnership(user1.address)).to.emit(
      mock,
      "OwnershipTransferred"
    );

    await expect(mock.connect(signer).grantRole(MODERATOR_ROLE, user2.address))
      .to.be.reverted;
  });

  it("should emit MintEvent when user calls mint with DEFAULT_ADMIN_ROLE", async () => {
    await expect(
      mock.connect(signer).grantRole(DEFAULT_ADMIN_ROLE, user1.address)
    ).to.emit(mock, "RoleGranted");

    await expect(mock.connect(user1).mint()).to.emit(mock, "MintEvent");
  });

  it("should revert when user calls transferOwnership as with zero address argument", async () => {
    await expect(
      mock.connect(signer).transferOwnership(ethers.constants.AddressZero)
    ).to.be.revertedWith("Ownable: new owner is the zero address");
  });

  it("should revert when calling mint without admin or moderator permissions", async () => {
    await expect(mock.connect(user1).mint()).to.be.revertedWithCustomError(
      mock,
      "NotAdminOrModerator"
    );
  });
});
