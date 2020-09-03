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

describe('getSuggestedTagFormat', () => {
  it('should be executable', () => {
    expect(getSuggestedTagFormat('1.0.0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with default semver number', () => {
    expect(getSuggestedTagFormat('1.0.0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with major.minor only semver number', () => {
    expect(getSuggestedTagFormat('1.0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with major only semver number', () => {
    expect(getSuggestedTagFormat('1')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with major 0 semver number', () => {
    expect(getSuggestedTagFormat('0')).toBe('${SEMVER_TOKEN}');
  });

  it('should work with "v" prefixed semver number', () => {
    expect(getSuggestedTagFormat('v1.0.0')).toBe('v${SEMVER_TOKEN}');
  });

  it('should work with npm scope semver number', () => {
    expect(getSuggestedTagFormat('deprecation-crawler@1.0.0')).toBe(
      'deprecation-crawler@${SEMVER_TOKEN}'
    );
  });

  it('should work with random prefixed semver number', () => {
    expect(getSuggestedTagFormat('some-string-1.0.0')).toBe(
      'some-string-${SEMVER_TOKEN}'
    );
  });
});
