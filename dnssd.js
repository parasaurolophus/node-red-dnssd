module.exports = function (RED) {

    const dnssd = require('@gravitysoftware/dnssd')

    function dnssdBrowser(config) {

        let node

        function serviceUp(service) {

            node.send([{ payload: service }, null, null])
        }

        function serviceDown(service) {

            node.send([null, { payload: service }, null])

        }

        function browserError(event) {

            node.status({ text: node.service, shape: 'dot', fill: 'red' })
            node.send([null, null, { payload: event }])
        }

        try {

            RED.nodes.createNode(this, config)
            node = this
            node.service = config.service
            node.udp = config.udp
            node.status({ text: node.service, shape: 'ring', fill: 'yellow' })

            const handler = node.udp ? dnssd.udp : dnssd.tcp
            const browser = dnssd.Browser(handler(node.service))
                .on('serviceUp', serviceUp)
                .on('serviceDown', serviceDown)
                .on('error', browserError)
                .start()

            node.on('close', () => browser.stop())
            node.status({ text: node.service, shape: 'dot', fill: 'green' })

        } catch (e) {

            node.status({ text: config.service, shape: 'ring', fill: 'red' })
            node.error('dnsSd: ' + e)

        }
    }

    function dnssdAdvertisement(config) {

        let node
        let advertisement

        function onAdvertisementInput(msg) {

            try {

                switch (msg.payload.command) {

                    case 'start':

                        advertisement.start()
                        node.status({ text: node.service, shape: 'dot', fill: 'green' })
                        break

                    case 'stop':

                        advertisement.stop(false)
                        break

                    case 'updateTXT':

                        node.options.txt = msg.payload.txt
                        advertisement.updateTXT(node.options.txt)
                        break

                    default:
                        throw 'unsupported command ' + msg.payload.command

                }

            } catch (e) {

                node.error('dnssdAdvertisement: ' + e)

            }
        }

        function advertisementError(event) {

            node.status({ text: node.service, shape: 'dot', fill: 'red' })
            node.send([null, null, null, { payload: event }])

        }

        function advertisementStopped() {

            node.status({ text: node.service, shape: 'dot', fill: 'yellow' })
            node.send([null, null, { payload: new Date().getTime() }, null])

        }

        function instanceRenamed(event) {

            node.send([{ payload: event }, null, null, null])

        }

        function hostRenamed(event) {

            node.send([null, { payload: event }, null, null])

        }

        return new Promise((resolve, reject) => {

            RED.util.evaluateNodeProperty(config.options, config.optionstype, node, null, (err, value) => {

                if (err) {

                    reject(err)

                }

                RED.nodes.createNode(this, config)
                node = this
                node.options = value
                node.service = config.service
                node.port = Number.parseInt(config.port)
                node.udp = config.udp
                node.on('input', onAdvertisementInput)
                node.status({ text: node.service, shape: 'ring', fill: 'yellow' })

                const handler = node.udp ? dnssd.udp : dnssd.tcp
                advertisement = dnssd.Advertisement(handler(node.service), node.port, node.options)
                    .on('error', advertisementError)
                    .on('stopped', advertisementStopped)
                    .on('instanceRenamed', instanceRenamed)
                    .on('hostRenamed', hostRenamed)

                node.on('close', function (_removed, done) {

                    advertisement.stop(false, function () { done() })

                })

                resolve(node)

            })
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