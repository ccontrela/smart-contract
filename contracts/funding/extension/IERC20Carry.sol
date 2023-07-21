// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IERC20Carry {
    error CannotBePreferredReturn();
    error NotEnoughTokensToWithdraw();
    error WithdrawCarryFailed(bytes32, address, uint256);
    error DepositCarryFailed(bytes32, uint256);

    function withdrawCarry(
        bytes32 merkleRoot_,
        bytes32[] calldata merkleProof_,
        uint256 tokenAmount_
    ) external;

    function depositCarry(
        bytes32 merkleRoot_,
        bytes32[] calldata merkleProof_,
        uint256 erc20Amount_
    ) external;
}
