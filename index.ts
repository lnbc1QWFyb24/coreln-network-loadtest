import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import LnMessage from "lnmessage";

const SEC = 1000;

yargs(hideBin(Bun.argv))
  .scriptName("coreln-load-test")
  .usage("$0 <cmd> [args]")
  .command(
    "loadtest [connections]",
    "Load test a list of connections",
    (yargs) => {
      yargs.positional("connections", {
        type: "string",
        default: "./connections",
        describe: "The path to the file containing connection details",
      });
    },
    async function (argv) {
      const filePath = (argv.connections as string) || "./connections";
      const connectionsStr = await Bun.file(filePath).text();

      if (!connectionsStr) {
        throw new Error(`Could not find file at path: ${filePath}`);
      }

      const connections = connectionsStr.split("\n");

      if (!connections.length) {
        throw new Error(
          `File at path: ${filePath} does not contain a list of new line separated connection details`
        );
      }

      const pendingConnections = [];

      while (connections.length) {
        const connectionDetails = connections.shift();

        if (connectionDetails) {
          pendingConnections.push(connectNode(connectionDetails));
        }
      }

      await Promise.all(pendingConnections);
    }
  )
  .help().argv;

async function connectNode(connectionDetails: string) {
  const url = new URL(connectionDetails!);
  const address = url.searchParams.get("address") as string; // nodeId@hostname:port
  const rune = url.searchParams.get("rune") as string; // admin rune
  const type = url.searchParams.get("type") as string; // direct | proxy
  const value = url.searchParams.get("value") as string; // proxyUrl | wss:
  const { publicKey, ip, port } = parseNodeAddress(address);

  await randomDelay();

  const socket = new LnMessage({
    remoteNodePublicKey: publicKey,
    wsProxy: type === "proxy" ? value : undefined,
    wsProtocol: type === "direct" ? (value as "ws:" | "wss:") : undefined,
    ip,
    port: port || 9735,
  });

  console.log(`Connecting to ${address}`);

  await socket.connect();

  console.log(`Connected to ${address}`);

  console.log(`fetching initial data for ${publicKey}`);

  await Promise.all([
    socket.commando({ method: "listfunds", rune }),
    socket.commando({ method: "getinfo", rune }),
    socket.commando({ method: "listinvoices", rune }),
    socket.commando({ method: "listpays", rune }),
  ]);

  console.log(`initial data fetched for ${publicKey}`);
}

/** Will delay between 1 second and 30 seconds
 * to simulate all user connecting within 30 seconds
 */
function randomDelay() {
  const min = 1 * SEC;
  const max = 30 * SEC;
  const delay = Math.floor(Math.random() * (max - min + 1) + min);

  return new Promise((resolve) => setTimeout(resolve, delay));
}

function parseNodeAddress(address: string): {
  publicKey: string;
  ip: string;
  port?: number;
} {
  const [publicKey, host] = address.split("@");
  const [ip, port] = host.split(":");

  return { publicKey, ip, port: port ? parseInt(port) : undefined };
}
