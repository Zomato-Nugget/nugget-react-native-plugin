import { Platform } from 'react-native';
import { NuggetSDK } from '../index';

const mockCloseNuggetSDK = jest.fn();
const mockCloseNuggetSDKRead = jest.fn();

jest.mock('react-native', () => ({
  NativeModules: {
    NuggetRN: {
      initializeNuggetFactory: jest.fn(),
      // A getter, so the tests can tell when the native method is so much as looked up.
      get closeNuggetSDK() {
        mockCloseNuggetSDKRead();
        return mockCloseNuggetSDK;
      },
    },
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  })),
  Platform: {
    OS: 'ios',
    select: (spec: { ios?: unknown; default?: unknown }) =>
      spec.ios ?? spec.default,
  },
}));

function setPlatform(os: 'ios' | 'android') {
  (Platform as { OS: string }).OS = os;
}

describe('closeNuggetSDK', () => {
  let sdk: NuggetSDK;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    sdk = NuggetSDK.getInstance({ nameSpace: 'test' }, {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('on Android', () => {
    beforeEach(() => setPlatform('android'));

    it('resolves to false', async () => {
      await expect(sdk.closeNuggetSDK()).resolves.toBe(false);
    });

    it('neither looks up nor calls the native method, which Android does not have', async () => {
      await sdk.closeNuggetSDK();

      expect(mockCloseNuggetSDKRead).not.toHaveBeenCalled();
      expect(mockCloseNuggetSDK).not.toHaveBeenCalled();
    });
  });

  describe('on iOS', () => {
    beforeEach(() => setPlatform('ios'));

    it('resolves to true when the native side closed the Nugget screen', async () => {
      mockCloseNuggetSDK.mockResolvedValue({ nuggetSDKResult: true });

      await expect(sdk.closeNuggetSDK()).resolves.toBe(true);
      expect(mockCloseNuggetSDK).toHaveBeenCalledTimes(1);
      expect(mockCloseNuggetSDK).toHaveBeenCalledWith();
    });

    it('resolves to false when there was no Nugget screen to close', async () => {
      mockCloseNuggetSDK.mockResolvedValue({ nuggetSDKResult: false });

      await expect(sdk.closeNuggetSDK()).resolves.toBe(false);
    });

    it('resolves to false when the native side returns nothing', async () => {
      mockCloseNuggetSDK.mockResolvedValue(undefined);

      await expect(sdk.closeNuggetSDK()).resolves.toBe(false);
    });
  });
});
