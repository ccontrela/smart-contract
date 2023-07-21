// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IFund {
    enum FundingStatus {
        notStarted,
        open,
        closed,
        withdrawn,
        recoupment,
        cancelled
    }

    error FundingStatusRequired(FundingStatus status);
    error FundingCancelled();
    error FundingTransferFailed(uint256 amount);
    error WithdrawFailed(uint256 amount);
    error InsufficientAllowance();
    error ProofFailed();
    error InvalidAmount();

    event Refund(address indexed to, uint256 amount);
    event Withdraw(uint256 amount);

    function refund() external;

    function open() external;

    function close() external;

    function cancel() external;

    function withdraw() external;
}
