import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	output: "standalone",
	transpilePackages: ["shared"],
	reactStrictMode: false,
	async redirects() {
		return [
			{
				source: "/channels",
				destination: "/",
				permanent: true,
			},
			{
				source: "/advertisement",
				destination: "/",
				permanent: true,
			},
		]
	},
}

export default nextConfig
