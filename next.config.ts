import type { NextConfig } from "next";
import path from "path";

const stylesDir = path.join(process.cwd(), "styles").replace(/\\/g, "/");

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(process.cwd(), "styles")],
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
