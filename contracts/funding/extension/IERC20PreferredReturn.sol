// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IERC20PreferredReturn {
    error WithdrawPrefFailed(address, uint256);
    error DepositPrefFailed(uint256);

    function withdrawPref(bytes32[] calldata merkleProof_, uint256 tokenAmount_)
        external;

    function depositPref(bytes32 merkleRoot_, bytes32[] calldata merkleProof_)
        external;

    function returnBasisPoints() external view returns (uint256);
}
