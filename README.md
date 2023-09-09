# @parasaurolophus/node-red-dnssd

Wrap
[@gravitysoftware/dnssd](https://www.npmjs.com/package/@gravitysoftware/dnssd)
for use in [Node-RED](https://nodered.org).

![](./screenshot.png)

This provides a superset of the functionality supported by
[node-red-node-discovery](https://flows.nodered.org/node/node-red-node-discovery),
without generating any warnings in the Node-RED log.

---

## dnssd-browser

### Input

- none

### Outputs

1. Stream of `Browser.serviceUp()` events
2. Stream of `Browser.serviceDown()` events
3. Stream of `Browser.error()` events

---

## dnssd-advertisement

### Input

`msg.payload.command` specifies a `dnssd.Advertisement` method to invoke:

#### `start`

Broadcast a "service up" event.

```json
{ "payload": { "command": "start" } }
```

#### `stop`

Broadcast a "service down" event.

```json
{ "payload": { "command": "stop" } }
```

#### `updateTXT`

Update the `TXT` record. (Note that this is provided for completeness but is of
limited utility since it does not trigger any of the events exposed by the
`dnssd.Browser` object.)

```json
{
    "payload": {
        "command": "updateTXT",
        "txt": {
            "foo": "bar"
        }
    }
}
```

### Outputs

1. Stream of `Advertiser.instanceRenamed()` events 
2. Stream of `Advertiser.hostRenamed()` events
3. Stream of `Advertiser.stopped()` events
3. Stream of `Advertiser.error()` events

---

## Details

This is a deliberately thin wrapper around the functionality exposed by
[@gravitysoftware/dnssd](https://www.npmjs.com/package/@gravitysoftware/dnssd),
which is a pure JavaScript implementation of [DNS-SD](http://www.dns-sd.org/).

The _Service_ configuration string is the name of the DNS-SD service to
broadcast using `dnssd-advertisement` or watch using `dnssd-browser`.

By default, these nodes will use TCP. The _Use UDP?_ configuration checkbox
tells them to use UDP instead.

`dnssd-advertisement` also requires a _Port_ number and can optionally take
_Options_, including a `txt` record. _Options_ may be specified using JSON.

While `dnssd-browser` nodes start listening automatically when flows start,
`dnssd-advertiser` nodes must be started explicitly by sending a `msg` with
`command` set to `start` to their inputs:

```json
{ "payload" : { "command": "start" } }
```
