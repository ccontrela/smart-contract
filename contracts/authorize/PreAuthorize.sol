// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract OwnableDelegateProxy {}

/**
 * Used to delegate ownership of a contract to another address, to save on unneeded transactions to approve contract use for users
 */
contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

abstract contract PreAuthorize {
    mapping(address => bool) private authorizedAddresses;
    address public proxyRegistryAddress;

    error ZeroAuthorizedAddress();

    constructor(address[] memory _preAuthorized, address _proxyRegistryAddress)
    {
        for (uint256 i = 0; i < _preAuthorized.length; i++) {
            _setAuthorizedAddress(_preAuthorized[i], true);
        }
        proxyRegistryAddress = _proxyRegistryAddress;
    }

    function _setAuthorizedAddress(address authorizedAddress, bool authorized)
        internal
    {
        if (authorizedAddress == address(0)) revert ZeroAuthorizedAddress();
        authorizedAddresses[authorizedAddress] = authorized;
    }

    function _isAuthorizedAddress(address operator)
        internal
        view
        returns (bool)
    {
        return authorizedAddresses[operator];
    }

    /**
     * Override isApprovedForAll to whitelist the trusted accounts to enable gas-free listings.
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        virtual
        returns (bool isOperator)
    {
        if (_isAuthorizedAddress(_operator)) {
            return true;
        }

        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(_owner)) == _operator) {
            return true;
        }

        return false;
    }
}
