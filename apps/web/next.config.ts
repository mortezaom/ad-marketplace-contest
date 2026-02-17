import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	transpilePackages: ["shared"],
	reactStrictMode: false,
	allowedDevOrigins: ["localhost:3000", "*.mortezaom.dev"],
	async redirects() {
		return [
			{
				source: "/advertisement",
				destination: "/",
				permanent: true,
			},
		]
	},
}

export default nextConfig
