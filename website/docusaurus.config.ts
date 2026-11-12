import type * as Preset from '@docusaurus/preset-classic';
import type { PluginOptions as SearchLocalOptions } from '@easyops-cn/docusaurus-search-local';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const repoUrl = 'https://github.com/AlexInCube/AlCoTest';

const config: Config = {
  title: 'AICoTest',
  tagline: 'Cool audiobot for Discord',
  favicon: 'img/logo.png',

  // Published to GitHub Pages by .github/workflows/docs.yaml
  url: 'https://alexincube.github.io',
  baseUrl: '/AlCoTest/',
  organizationName: 'AlexInCube',
  projectName: 'AlCoTest',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
      onBrokenMarkdownImages: 'throw'
    }
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },

  presets: [
    [
      'classic',
      {
        // Docs-only site: the docs are the home page, no blog
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: `${repoUrl}/edit/master/website/`
        },
        blog: false
      } satisfies Preset.Options
    ]
  ],

  // Search index is built with the site, no external service or keys
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsRouteBasePath: '/',
        indexBlog: false,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true
      } satisfies SearchLocalOptions
    ]
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      respectPrefersColorScheme: true
    },
    navbar: {
      title: 'AICoTest',
      logo: {
        alt: 'AICoTest logo',
        src: 'img/logo.png'
      },
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { href: repoUrl, label: 'GitHub', position: 'right' }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Setup', to: '/setup' },
            { label: 'Commands', to: '/commands' }
          ]
        },
        {
          title: 'Community',
          items: [
            { label: 'Issues', href: `${repoUrl}/issues/new/choose` },
            { label: 'Discussions', href: `${repoUrl}/discussions` }
          ]
        }
      ],
      copyright: `AICoTest by AlexInCube. Built with Docusaurus.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['powershell', 'bash']
    }
  } satisfies Preset.ThemeConfig
};

export default config;
