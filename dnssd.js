module.exports = function (RED) {

    let node

    function serviceUp(service) {

        try {

            node.send([
                { payload: service },
                null,
                null
            ])

        } catch (e) {

            node.status({
                text: config.service,
                shape: 'ring',
                fill: 'red'
            })

            node.error('serviceUp: ' + e)

        }
    }

    function serviceDown(service) {

        try {

            node.send([
                null,
                { payload: service },
                null
            ])

        } catch (e) {

            node.status({
                text: config.service,
                shape: 'ring',
                fill: 'red'
            })

            node.error('serviceDown: ' + e)

        }
    }

    function dnssdError(event) {

        node.status({
            text: JSON.stringify(event, undefined, 1),
            shape: 'dot',
            fill: 'red'
        })

        node.send([
            null,
            null,
            { payload: event }
        ])
    }

    function dnsSd(config) {

        const dnssd = require('@gravitysoftware/dnssd')

        try {

            RED.nodes.createNode(this, config)
            this.service = config.service
            this.udp = config.udp
            node = this

            node.status({
                text: config.service,
                shape: 'ring',
                fill: 'yellow'
            })

            const handler = node.udp ? dnssd.udp : dnssd.tcp
            const browser = dnssd.Browser(handler(node.service))
                .on('serviceUp', serviceUp)
                .on('serviceDown', serviceDown)
                .on('error', dnssdError)
                .start()

            node.on('close', () => browser.stop())

            node.status({
                text: config.service,
                shape: 'dot',
                fill: 'green'
            })

        } catch (e) {

            node.status({
                text: config.service,
                shape: 'ring',
                fill: 'red'
            })

            node.error('dnsSd: ' + e)

        }
    }

    try {

        RED.nodes.registerType("dnssd", dnsSd)

    } catch (e) {

        node.status({
            text: config.service,
            shape: 'ring',
            fill: 'red'
        })

        node.error('registerType: ' + e)

    }
}