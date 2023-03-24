# @parasaurolophus/node-red-dnssd

Wrap
[@gravitysoftware/dnssd](https://www.npmjs.com/package/@gravitysoftware/dnssd)
for use in [Node-RED](https://nodered.org).

## dnssd-browser

### Input

none

### Outputs

1. Stream of `Browser.serviceUp()` events
2. Stream of `Browser.serviceDown()` events
3. Stream of `Browser.error()` events

## dnssd-advertisement

### Input

`msg.payload.command` specifies a `dnssd.Advertisement` method to
invoke:

- `start`
- `stop`
- `updateTXT`

For `updateTXT`, `msg.payload.txt` must be the new set of key/value
pairs.

**Note:** `dnssd.Advertisement.updateTXT()` seems to be only partially
functional, so this feature is provided largely for completeness
(which is to say, a symptom of this node's author's mild OCD when
it comes to software).

### Outputs

1. Stream of `Advertiser.instanceRenamed()` events 
2. Stream of `Advertiser.hostRenamed()` events
3. Stream of `Advertiser.stopped()` events
3. Stream of `Advertiser.error()` events

## Details

This is a deliberately thin wrapper around the functionality exposed by
[@gravitysoftware/dnssd](https://www.npmjs.com/package/@gravitysoftware/dnssd),
which is a pure JavaScript implementation of
[DNS-SD](http://www.dns-sd.org/).

The _Service_ configuration string is the name of the
DNS-SD service to watch for by `dnssd-browser` or broadcast
using `dnssd-advertisement`.

By default, these nodes will use TCP. The _Use UDP?_
configuration checkbox tells them to use UDP instead.

`dnssd-advertisement` also requires a _Port_ number and
can optionally take _Options_, including a `txt` record.

While `dnssd-browser` nodes start listening automatically
when flows start, `dnssd-advertiser` nodes must be started
explicitly by sending a `msg` with `command` set to `start`
to their inputs:

```json
{ "payload" : { "command": "start" }}
```

## Notes

- A future version may add support for dnssd.all() in
  addition if a need arises which, so far, has not.
- This is effectively a drop-in replacement for
  [node-red-node-discovery](https://www.npmjs.com/package/node-red-node-discovery)
  but without any non-JavaScript dependencies, with support
  for IPv6 addresses and no  warnings in the Node-RED log at
  startup.