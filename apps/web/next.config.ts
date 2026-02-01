import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	output: "standalone",
	transpilePackages: ["shared"],
	reactStrictMode: false,
}

export default nextConfig
