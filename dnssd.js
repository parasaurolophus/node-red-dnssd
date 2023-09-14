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
            advertisement.start()
            node.status({ text: node.service, shape: 'dot', fill: 'green' })

        }

        function stopAdvertisement() {

            if (advertisement) {

                advertisement.stop(false)
                advertisement = null

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

            advertisement = null
            node.status({ text: node.service, shape: 'dot', fill: 'yellow' })
            node.send([
                null,
                null,
                {
                    payload: {
                        timestamp: new Date().getTime(),
                        started: (advertisement != null)
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

        return new Promise((resolve, reject) => {

            RED.util.evaluateNodeProperty(config.options, config.optionstype, node, null, (err, value) => {

                try {

                    if (err) {

                        reject(err)

                    }

                    RED.nodes.createNode(this, config)
                    node = this
                    node.options = value
                    node.service = config.service
                    node.port = Number.parseInt(config.port)
                    node.udp = config.udp
                    node.on('close', function (_, done) {

                       stopAdvertisement()
                       done()

                    })

                    node.on('input', onAdvertisementInput)
                    node.status({ text: node.service, shape: 'ring', fill: 'yellow' })
                    resolve(node)

                } catch (e) {

                    reject(e)

                }
            })
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

                switch (msg.payload.command) {

                    case 'start':
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

        return new Promise((resolve, reject) => {

            try {

                RED.nodes.createNode(this, config)
                node = this
                node.service = config.service
                node.udp = config.udp
                node.on('input', onBrowserInput)
                node.on('close', (_, done) => {

                    stopBrowser()
                    done()

                })
                node.status({ text: node.service, shape: 'ring', fill: 'yellow' })
                resolve(node)

            } catch (e) {

                reject(e)

            }
        })
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