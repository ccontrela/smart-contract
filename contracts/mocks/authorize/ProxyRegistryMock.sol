// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev A simple mock ProxyRegistry for use in local tests with minimal security
 */
contract ProxyRegistryMock {
    mapping(address => address) public proxies;

    /***********************************|
    |  Public Configuration Functions   |
    |__________________________________*/

    /**
     * @notice Allow the owner to set a proxy for testing
     * @param address_           The address that the proxy will act on behalf of
     * @param proxyForAddress_  The proxy that will act on behalf of the address
     */
    function setProxy(address address_, address proxyForAddress_) external {
        proxies[address_] = proxyForAddress_;
    }
}
