# @parasaurolophus/node-red-dnssd

Wrap
[@gravitysoftware/dnssd](https://www.npmjs.com/package/@gravitysoftware/dnssd)
for use in [Node-RED](https://nodered.org).

## Input

none

## Outputs

1. Stream of `Browser.serviceUp()` events
2. Stream of `Browser.serviceDown()` events
3. Stream of `Browser.error()` events

## Details

This is a deliberately thin wrapper around the functionality exposed by
[@gravitysoftware/dnssd](https://www.npmjs.com/package/@gravitysoftware/dnssd),
which is a pure JavaScript implementation of
[DNS-SD](http://www.dns-sd.org/).

The _Service_ configuration string is the name of the
DNS-SD service to watch for.

By default, this node will use TCP to watch for DNS-SD
messages. The _Use UDP?_ configuration checkbox tells it to
use UDP instead.

## Notes

- A future version may add support for dnssd.all() in
  addition if a need arises which, so far, has not.
- This is effectively a drop-in replacement for
  [node-red-node-discovery](https://www.npmjs.com/package/node-red-node-discovery)
  but without any non-JavaScript dependencies, with support
  for IPv6 addresses and no  warnings in the Node-RED log at
  startup.