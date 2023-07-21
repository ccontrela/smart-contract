// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../admin/AdminPermission.sol";

// Caller contract
contract AdminPermissionMock is AdminPermission {
    event MintEvent();

    constructor() AdminPermission(msg.sender) {}

    function mint() public onlyAdminOrModerator {
        emit MintEvent();
    }
}
