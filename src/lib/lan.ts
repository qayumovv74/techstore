import { networkInterfaces } from "node:os";

/** IPv4-адреса компьютера в домашней сети (192.168.x.x и т.п.) — по ним сайт открывается с телефона */
export function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((a) => a && a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254."))
    .map((a) => a!.address);
}
