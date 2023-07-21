// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../funding/ERC20Fund.sol";
import "../../funding/extension/ERC20PreferredReturn.sol";

contract PreferredReturnMock is ERC20, ERC20Fund, ERC20PreferredReturn {
    constructor(
        string memory name_,
        string memory symbol_,
        address erc20Token_,
        uint256 tokenPrice_,
        uint256 returnBasisPoints_
    )
        ERC20(name_, symbol_)
        ERC20Fund(erc20Token_, tokenPrice_)
        ERC20PreferredReturn(returnBasisPoints_)
    {}

    // Compulsory overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC20Fund, ERC20PreferredReturn)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
