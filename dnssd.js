module.exports = function (RED) {

    // "Error: send ENETUNREACH 224.0.0.251:5353"

    const dnssd = require('@gravitysoftware/dnssd')

    function dnssdAdvertisement(config) {

        var node
        var advertisement = null

        function onAdvertisementInput(msg) {

            try {

                switch (msg.payload.command) {

                    case 'start':

                        let udp = msg.payload.udp || node.udp
                        let service = msg.payload.service || node.service
                        let port = msg.payload.port || node.port
                        let options = msg.payload.options || node.options
                        node.udp = udp
                        node.service = service
                        node.port = port
                        node.options = options
                        restartAdvertisement()
                        break

                    case 'stop':

                        stopAdvertisement()
                        break

                    case 'updateTXT':

                        updateTXT(msg.payload.txt)
                        break

                    default:
                        throw 'unsupported command ' + msg.payload.command

                }

            } catch (e) {

                node.error('dnssdAdvertisement: ' + e)

            }
        }

        function restartAdvertisement() {

            stopAdvertisement()
            const handler = node.udp ? dnssd.udp : dnssd.tcp
            advertisement = dnssd.Advertisement(handler(node.service), node.port, node.options)
                .on('error', advertisementError)
                .on('stopped', advertisementStopped)
                .on('instanceRenamed', instanceRenamed)
                .on('hostRenamed', hostRenamed)
                .start()
            node.status({ text: node.service, shape: 'dot', fill: 'green' })

        }

        function stopAdvertisement() {

            if (advertisement) {

                let a = advertisement

                advertisement.stop(false, () => {

                    if (a === advertisement) {

                        advertisement = null
                        node.status({ text: node.service, shape: 'dot', fill: 'yellow' })

                    }
                })
            }
        }

        function updateTXT(txt) {

            if (advertisement) {

                advertisement.updateTXT(txt)
                restartAdvertisement()

            }
        }

        function advertisementError(event) {

            node.status({ text: node.service, shape: 'dot', fill: 'red' })
            node.send([
                null,
                null,
                null,
                {
                    payload: {
                        timestamp: new Date().getTime(),
                        event: event,
                        started: (advertisement != null)
                    }
                }
            ])
        }

        function advertisementStopped() {

            node.send([
                null,
                null,
                {
                    payload: {
                        timestamp: new Date().getTime()
                    }
                },
                null
            ])
        }

        function instanceRenamed(event) {

            node.send([{ payload: event }, null, null, null])

        }

        function hostRenamed(event) {

            node.send([null, { payload: event }, null, null])

        }

        RED.nodes.createNode(this, config)
        node = this
        RED.util.evaluateNodeProperty(config.options, config.optionstype, node, null, (err, value) => {

            try {

                if (err) {

                    throw err

                }

                node.options = value
                node.service = config.service
                node.port = Number.parseInt(config.port)
                node.udp = config.udp
                node.on('close', (_, done) => {

                    if (advertisement) {

                        advertisement.stop(false, done)

                    } else {

                        done()

                    }
                })

                node.on('input', onAdvertisementInput)
                node.status({ text: node.service, shape: 'ring', fill: 'yellow' })

            } catch (e) {

                RED.log.error(e)
                node.status({ text: node.service, shape: 'ring', fill: 'red' })

            }
        })
    }

    function dnssdBrowser(config) {

        var node
        var browser

        function serviceUp(service) {

            node.send([{ payload: service }, null, null, null])
        }

        function serviceDown(service) {

            node.send([null, { payload: service }, null, null])

        }

        function browserError(event) {

            node.status({ text: node.service, shape: 'dot', fill: 'red' })
            node.send([
                null,
                null,
                {
                    payload: {
                        timestamp: new Date().getTime(),
                        event: event
                    }
                },
                null])
        }

        function restartBrowser() {

            stopBrowser()
            const handler = node.udp ? dnssd.udp : dnssd.tcp
            browser = dnssd.Browser(handler(node.service))
                .on('serviceUp', serviceUp)
                .on('serviceDown', serviceDown)
                .on('error', browserError)
                .start()
            node.status({ text: node.service, shape: 'dot', fill: 'green' })

        }

        function stopBrowser() {

            if (browser) {

                browser.stop()
                browser = null
                node.status({ text: node.service, shape: 'dot', fill: 'yellow' })

            }
        }

        function listServices() {

            if (browser) {

                node.send([
                    null,
                    null,
                    null,
                    { payload: browser.list() }
                ])
            }
        }

        function onBrowserInput(msg) {

            try {

                if (!(((typeof msg.payload) == 'object') && Object.prototype.hasOwnProperty.call(msg.payload, 'command'))) {

                    RED.log.error(msg.payload)
                    throw 'ignoring ill-formed input message'

                }

                switch (msg.payload.command) {

                    case 'start':
                        node.service = msg.payload.service || node.service
                        node.udp = msg.payload.udp || node.udp
                        restartBrowser()
                        break

                    case 'stop':
                        stopBrowser()
                        break

                    case 'list':
                        listServices()
                        break

                    default:
                        throw 'unsupported command ' + msg.payload.command
                }

            } catch (e) {

                node.error('dnssd.Browser: ' + e)

            }
        }

        RED.nodes.createNode(this, config)
        node = this

        try {

            node.service = config.service
            node.udp = config.udp
            node.on('input', onBrowserInput)
            node.on('close', (_, done) => {

                stopBrowser()
                done()

            })

            node.status({ text: node.service, shape: 'ring', fill: 'yellow' })

        } catch (e) {

            RED.log.error(e)
            node.status({ text: node.service, shape: 'ring', fill: 'red' })

        }
    }

    try {

        RED.nodes.registerType("dnssd-browser", dnssdBrowser)
        RED.nodes.registerType("dnssd-advertisement", dnssdAdvertisement)

    } catch (e) {

        node.status({
            text: config.service,
            shape: 'ring',
            fill: 'red'
        })

        node.error('registerType: ' + e)

    }
}