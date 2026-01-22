/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config, { isServer }) {
    // Find and modify the existing rule that handles SVG files
    config.module.rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('svg')) {
        // Exclude SVG from default asset/resource loader
        rule.exclude = /\.svg$/i;
      }
    });

    // Add SVGR loader for SVG files
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            typescript: true,
            ext: 'tsx',
          },
        },
      ],
    });

    return config;
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

module.exports = nextConfig;
  