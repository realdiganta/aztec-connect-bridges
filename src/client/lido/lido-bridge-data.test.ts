import { LidoBridgeData } from './lido-bridge-data';
import { IWstETH, ICurvePool } from '../../../typechain-types';
import { AztecAsset, AztecAssetType } from '../bridge-data';
import { BigNumber } from 'ethers';

type Mockify<T> = {
  [P in keyof T]: jest.Mock;
};

describe('lido bridge data', () => {
  let lidoBridgeData: LidoBridgeData;
  let wstethContract: Mockify<IWstETH>;
  let curvePoolContract: Mockify<ICurvePool>;
  let ethAsset: AztecAsset;
  let wstETHAsset: AztecAsset;
  let emptyAsset: AztecAsset;

  beforeAll(() => {
    ethAsset = {
      id: 1n,
      assetType: AztecAssetType.ETH,
      erc20Address: '0x0',
    };
    wstETHAsset = {
      id: 2n,
      assetType: AztecAssetType.ERC20,
      erc20Address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    };
    emptyAsset = {
      id: 0n,
      assetType: AztecAssetType.NOT_USED,
      erc20Address: '0x0',
    };
  });

  it('should get wstETH when deposit small amount of ETH - curve route', async () => {
    const depositAmount = BigInt(10e18);
    const expectedOutput = depositAmount + 1n;

    curvePoolContract = {
      ...curvePoolContract,
      get_dy: jest.fn().mockResolvedValue(BigNumber.from(expectedOutput)),
    };

    lidoBridgeData = new LidoBridgeData(wstethContract as any, curvePoolContract as any);

    const output = await lidoBridgeData.getExpectedOutput(
      ethAsset,
      emptyAsset,
      wstETHAsset,
      emptyAsset,
      0n,
      depositAmount,
    );
    expect(expectedOutput == output[0]).toBeTruthy();
  });
  it('should get wstETH when deposit a large amount of ETH - lido route', async () => {
    const depositAmount = BigInt(10000000e18);
    const expectedOutput = depositAmount;

    curvePoolContract = {
      ...curvePoolContract,
      get_dy: jest.fn().mockResolvedValue(BigNumber.from(depositAmount - 1n)),
    };

    lidoBridgeData = new LidoBridgeData(wstethContract as any, curvePoolContract as any);

    const output = await lidoBridgeData.getExpectedOutput(
      ethAsset,
      emptyAsset,
      wstETHAsset,
      emptyAsset,
      0n,
      depositAmount,
    );
    expect(expectedOutput == output[0]).toBeTruthy();
  });
  it('should exit to ETH when deposit WstETH', async () => {
    const depositAmount = BigInt(100e18);
    const stethOutputAmount = BigInt(101e18);
    const expectedOutput = BigInt(105e18);

    wstethContract = {
      ...wstethContract,
      getStETHByWstETH: jest.fn().mockResolvedValue(BigNumber.from(stethOutputAmount)),
    };

    curvePoolContract = {
      ...curvePoolContract,
      get_dy: jest.fn().mockResolvedValue(BigNumber.from(expectedOutput)),
    };

    lidoBridgeData = new LidoBridgeData(wstethContract as any, curvePoolContract as any);

    const output = await lidoBridgeData.getExpectedOutput(
      wstETHAsset,
      emptyAsset,
      ethAsset,
      emptyAsset,
      0n,
      depositAmount,
    );

    expect(expectedOutput == output[0]).toBeTruthy();
  });
});
