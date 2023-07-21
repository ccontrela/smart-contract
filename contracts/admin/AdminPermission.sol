// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract AdminPermission is AccessControl, Ownable {
    error NotAdminOrOwner();
    error NotAdminOrModerator();
    error ZeroAdminAddress();

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    constructor(address defaultAdmin_) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin_);
    }

    modifier onlyAdmin() {
        if (
            !(owner() == _msgSender() ||
                hasRole(DEFAULT_ADMIN_ROLE, _msgSender()))
        ) revert NotAdminOrOwner();
        _;
    }

    modifier onlyAdminOrModerator() {
        if (
            !(owner() == _msgSender() ||
                hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) ||
                hasRole(MODERATOR_ROLE, _msgSender()))
        ) revert NotAdminOrModerator();
        _;
    }

    modifier checkAdminAddress(address _address) {
        if (_address == address(0)) {
            revert ZeroAdminAddress();
        }
        _;
    }

    function setAdminPermission(address _address)
        external
        onlyAdmin
        checkAdminAddress(_address)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, _address);
    }

    function removeAdminPermission(address _address)
        external
        onlyAdmin
        checkAdminAddress(_address)
    {
        _revokeRole(DEFAULT_ADMIN_ROLE, _address);
    }

    /**
     * @dev Override transferOwnership
     */
    function transferOwnership(address newOwner)
        public
        virtual
        override
        onlyOwner
    {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );

        _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
        _revokeRole(DEFAULT_ADMIN_ROLE, owner());
        _transferOwnership(newOwner);
    }
}
