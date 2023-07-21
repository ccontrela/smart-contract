import { ethers } from "hardhat";
import { utils } from "ethers";

export const getInterfaceId = (contractInterface: utils.Interface) => {
  let interfaceID = ethers.constants.Zero;
  const functions: string[] = Object.keys(contractInterface.functions);
  for (let i = 0; i < functions.length; i++) {
    interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
  }
  return interfaceID;
};
