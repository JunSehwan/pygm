// /** @type {import('next').NextConfig} */
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

// const nextConfig = {
//   output: 'export',
//   trailingSlash: false,
//   productionBrowserSourceMaps: true,

//   images: {
//     loader: 'akamai',
//     path: '',
//     domains: [
//       'pygm.co.kr',
//       'localhost',
//       'firebasestorage.googleapis.com',
//       'upload.wikimedia.org',
//       'lh3.googleusercontent.com',
//       'cdn.jsdelivr.net',
//       'loremflickr.com',
//     ],
//     formats: ['image/avif', 'image/webp'],
//   },

//   distDir: 'build',
//   compress: true,

//   compiler: {
//     styledComponents: {
//       displayName: true,
//       ssr: true,
//       preprocess: false,
//     },
//   },

//   webpack(config, { dev, isServer }) {
//     // 개발/배포 모드 구분
//     if (!dev) {
//       config.devtool = isServer ? false : 'hidden-source-map';
//     } else {
//       config.devtool = 'eval-source-map';
//     }

//     return config;
//   },
// };

// module.exports = withBundleAnalyzer(nextConfig);


const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // reactStrictMode: false,
  output: "export",
  trailingSlash: false,
  productionBrowserSourceMaps: true,
  experimental: {
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'https://api.pygm.co.kr/:path*', // API 서버로 프록시
  //     }
  //   ]
  // },
  images: {
    loader: 'akamai',
    path: '',
    domains: ['pygm.co.kr', 'localhost:3060', 'firebasestorage.googleapis.com', 'upload.wikimedia.org', 'lh3.googleusercontent.com', 'cdn.jsdelivr.net','loremflickr.com'],
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