import fs from "fs";
import path from "path";

export const getReleaseNote = () => {
  const filePath = path.join(process.cwd(), "RELEASE_NOTE.md");
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf-8");
};
