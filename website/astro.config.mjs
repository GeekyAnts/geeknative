// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightLinksValidator from 'starlight-links-validator'

// Published on GitHub Pages at https://geekyants.github.io/geeknative/.
// Internal links in content include the /geeknative base, and the links validator checks them at build time.
export default defineConfig({
  site: 'https://geekyants.github.io',
  base: '/geeknative',
  integrations: [
    starlight({
      title: 'geeknative',
      description:
        'One prompt, three native apps. Your coding agent builds the same app in SwiftUI, Jetpack Compose and TanStack Start from one spec.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/GeekyAnts/geeknative' },
        { icon: 'npm', label: 'npm', href: 'https://www.npmjs.com/package/geeknative' },
      ],
      editLink: { baseUrl: 'https://github.com/GeekyAnts/geeknative/edit/main/website/' },
      customCss: ['./src/styles/custom.css'],
      components: { Footer: './src/components/Footer.astro' },
      plugins: [starlightLinksValidator()],
      sidebar: [
        {
          label: 'Start here',
          items: ['start-here/introduction', 'start-here/quick-start', 'start-here/requirements'],
        },
        {
          label: 'Guides',
          items: [
            'guides/working-with-your-agent',
            'guides/idea-to-three-apps',
            'guides/design-changes',
            'guides/claude-code',
            'guides/other-agents',
          ],
        },
        {
          label: 'Concepts',
          items: [
            'concepts/how-it-works',
            'concepts/project-structure',
            'concepts/architecture',
            'concepts/specs-and-parity',
            'concepts/file-ownership',
          ],
        },
        {
          label: 'Reference',
          items: ['reference/cli', 'reference/contracts', 'reference/platforms'],
        },
        {
          label: 'Project',
          items: ['project/roadmap', 'project/contributing', 'project/changelog'],
        },
      ],
    }),
  ],
})
