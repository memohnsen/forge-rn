module.exports = (config) => ({
  type: 'widget',
  name: 'JournalWidget',
  displayName: 'Forge',
  bundleIdentifier: '.journalwidgetext',
  deploymentTarget: '18.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios?.entitlements?.['com.apple.security.application-groups'] ?? [],
  },
});
