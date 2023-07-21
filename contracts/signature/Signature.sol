// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

error HashUsed();
error ZeroSignerAddress();
error SignatureFailed(address signatureAddress, address signer);

abstract contract Signature {
    using ECDSA for bytes32;

    address private _signer;
    mapping(bytes32 => bool) private _isHashUsed;

    constructor(address signerAddress_){
        _signer = signerAddress_;
    }

    // Signature verfification
    modifier onlySignedTx(
        bytes32 hash_,
        bytes calldata signature_
    ) {
        if (_isHashUsed[hash_]) revert HashUsed();
        
        address signatureAddress = hash_
                .toEthSignedMessageHash()
                .recover(signature_);
        if (signatureAddress != _signer) revert SignatureFailed(signatureAddress, _signer);

        _isHashUsed[hash_] = true;
        _;
    }

    function _setSignerAddress(address signerAddress_) internal {
        if (signerAddress_ == address(0)) revert ZeroSignerAddress();
        _signer = signerAddress_;
    }

    function signerAddress() public view returns(address)  {
        return _signer;
    }
}
