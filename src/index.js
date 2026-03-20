import { createServer } from "http";
import { readFileSync, readFile } from "fs";
import { join } from "path";
import YAML from "yaml";
import { major } from "semver";

// Get current directory for ES modules (requires Node.js 20.16+)
const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher");

const configPath = join(__dirname, "..");
const yamlStr = readFileSync(join(configPath, `local.config.yml`));
global.config = YAML.parse(yamlStr.toString());

global.config.server.id =
  process.env.ID || global.config.server.id || "demoservice"; // Service identifier for URL path
global.config.server.host =
  process.env.HOST || global.config.server.host || "0.0.0.0";
global.config.server.port =
  process.env.PORT || global.config.server.port || 8083; // Server port
global.config.api.version =
  process.env.VERSION || global.config.api.version || "1.2.3"; // API version number

const baseDir = join(__dirname, "..", global.config.data.path);

const serviceRoot = `/${global.config.server.id}/v${major(
  global.config.api.version
)}`;

createServer((req, res) => {

    if (!req.url.startsWith(serviceRoot)) {
        res.writeHead(404);
        return res.end("Not found");
    }

    let relativePath = req.url.substring(serviceRoot.length) || "/index.html";
    let filePath = join(baseDir, relativePath);

    readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("File not found");
        }

        console.log("downloading", filePath);

        res.writeHead(200);
        res.end(data);
    });

}).listen(global.config.server.port, () => {
    console.log(`Server running at http://localhost:${global.config.server.port}${serviceRoot}`);
});