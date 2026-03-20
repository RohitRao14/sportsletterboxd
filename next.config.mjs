/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude seed and scripts from Next.js compilation
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "bcryptjs"];
    }
    return config;
  },
};

export default nextConfig;
