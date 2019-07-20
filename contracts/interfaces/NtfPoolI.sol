pragma solidity ^0.5.0;

interface NtfPoolI {
  function tokenDeposit(uint _amount) external;
  function requestOut(uint _amount) external;
  function tokenMemberWithdraw() external;
  function coinWithdraw() external;
}