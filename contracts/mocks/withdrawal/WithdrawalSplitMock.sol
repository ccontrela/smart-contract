// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../withdrawal/WithdrawalSplit.sol";

// Caller contract
contract WithdrawalSplitMock is WithdrawalSplit , ERC20
{
    address[] private _wallets = [
        address(0x1),
        address(0x2),
        address(0x3)
    ];

    uint256[] private _basisPoints = [
        7000,
        2000,
        1000
    ];

    constructor() ERC20("StandardERC20", "ERC20") {
        setBeneficiaries(_wallets, _basisPoints);
    }
    
    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
