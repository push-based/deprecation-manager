import {
  ensureConfigDefaults,
  getSuggestedTagFormat,
} from '../../src/lib/tasks/ensure-config-defaults';
import { CrawlConfig } from '../../src/lib/models';

describe('ensureConfigDefaults', () => {
  it('should be executable', (done) => {
    ensureConfigDefaults({
      deprecationComment: 'Details: {@link}',
    } as CrawlConfig).then((r) => {
      expect(r).toBeDefined();
      done();
    });
  });
});

const getError = (version) =>
  `Can't suggest tag format for ${version}. Please stick to a semver version format.`;

describe('getSuggestedTagFormat', () => {
  it('should be executable', () => {
    expect(getSuggestedTagFormat('1.0.0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with default semver number', () => {
    expect(getSuggestedTagFormat('1.0.0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with default 0 semver number', () => {
    expect(getSuggestedTagFormat('0.0.0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with major.minor only semver number', () => {
    expect(getSuggestedTagFormat('1.0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with major.minor 0 semver number', () => {
    expect(getSuggestedTagFormat('0.0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with major only semver number', () => {
    expect(getSuggestedTagFormat('1')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with major 0 semver number', () => {
    expect(getSuggestedTagFormat('0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with "v" prefixed semver number', () => {
    expect(getSuggestedTagFormat('v1.0.0')).toBe('v${SEMVER_TOKEN}');
    const valid = [
      ['v1.0.0', 'v${SEMVER_TOKEN}'],
      ['V1.0.0', 'V${SEMVER_TOKEN}'],
    ];
    valid.forEach((v) => {
      expect(getSuggestedTagFormat(v[0])).toBe(v[1]);
    });
  });

  it('should work with "@" semver number', () => {
    const valid = [
      ['packagename@1.0.0', 'packagename@${SEMVER_TOKEN}'],
      ['package-name@1.0.0', 'package-name@${SEMVER_TOKEN}'],
      ['package@name@1.0.0', 'package@name@${SEMVER_TOKEN}'],
    ];
    valid.forEach((v) => {
      expect(getSuggestedTagFormat(v[0])).toBe(v[1]);
    });
  });

  it('should work with "-" prefixed semver number', () => {
    const valid = [
      ['packagename-1.0.0', 'packagename-${SEMVER_TOKEN}'],
      ['package-name-1.0.0', 'package-name-${SEMVER_TOKEN}'],
      ['package@name-1.0.0', 'package@name-${SEMVER_TOKEN}'],
    ];
    valid.forEach((v) => {
      expect(getSuggestedTagFormat(v[0])).toBe(v[1]);
    });
  });

  it('should fail with multiple zeros', () => {
    const wrong = ['00.0.0', '0.00.0', '0.0.00'];
    wrong.forEach((v) => {
      expect(() => getSuggestedTagFormat(v)).toThrow(new Error(getError(v)));
    });
  });

  it('should fail with wrong package separator zeros', () => {
    const wrong = ['P0.0.0', '?0.0.0', '+0.0.0'];
    wrong.forEach((v) => {
      expect(() => getSuggestedTagFormat(v)).toThrow(new Error(getError(v)));
    });
  });
});
