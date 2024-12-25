const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // reactStrictMode: false,
  trailingSlash: false,
  productionBrowserSourceMaps: true,
  experimental: {
  },

  images: {
    loader: 'akamai',
    path: '',
    domains: ['pygm.co.kr', 'localhost:3060', 'firebasestorage.googleapis.com', 'upload.wikimedia.org', 'lh3.googleusercontent.com', 'cdn.jsdelivr.net'],
    formats: ['image/avif', 'image/webp'],
  },
  distDir: 'build',
  compress: true,
  // swcMinify: true,
  compiler: {
    styledComponents: true | {
      // Enabled by default in development, disabled in production to reduce file size,
      // setting this withBundleAnalyzer override the default for all environments.
      displayName: true,
      // Enabled by default.
      ssr: true,
      // Enabled by default.
      preprocess: false,
    },
  },
  devServer: {
    historyApiFallback: true,
  },
  devtool: 'eval-cheap-source-map',
  // webpack(config,options, { webpack }) {
  webpack(config, options) {

    if (!options.dev) {
      config.devtool = options.isServer ? false : 'eval'
    }
    // return config

    const prod = process.env.NODE_ENV === 'production';
    return {
      ...config,
      mode: prod ? 'production' : 'development',
      devtool: prod ? 'hidden-source-map' : 'eval',
      // plugins: [
      //   ...config.plugins,
      //   new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /^\.\/ko$/),
      // ],
    };
  },
});