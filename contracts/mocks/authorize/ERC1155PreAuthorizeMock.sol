// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../../authorize/PreAuthorize.sol";

contract ERC1155PreAuthorizeMock is PreAuthorize, ERC1155 {
    constructor(address[] memory preAuthorized_, address proxyRegistryAddress_)
        PreAuthorize(preAuthorized_, proxyRegistryAddress_)
        ERC1155("https://api.example.com/{id}.json")
    {}

    function mint(uint256 amount) public {
        _mint(msg.sender, 1, amount, "");
    }

    function burn(address account, uint256 amount) public {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not owner nor approved"
        );

        _burn(account, 1, amount);
    }

    function isApprovedForAll(address owner_, address operator_)
        public
        view
        virtual
        override(ERC1155, PreAuthorize)
        returns (bool)
    {
        return
            ERC1155.isApprovedForAll(owner_, operator_) ||
            PreAuthorize.isApprovedForAll(owner_, operator_);
    }
}
