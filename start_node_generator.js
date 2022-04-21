fs = require('fs');
const number = process.argv.slice(2)?.length > 0 ? parseInt(process.argv.slice(2)[0]?.replace('--number=', '')) : 10;
let original_port = 9701;
let port = original_port;

let startNodeFileContent = `#!/bin/bash

set -e

HOST="\${HOST:-0.0.0.0}"
START_PORT="9700"
NODE_NUM="${[...Array(number)].map((_, index) => index + 1).join(' ')}"

if [ ! -d "/home/indy/ledger/sandbox/keys" ]; then
    echo "Ledger does not exist - Creating..."

    if [ ! -z "$IPS" ]; then
        echo von_generate_transactions -s "$IPS" -n "$NODE_NUM"
        von_generate_transactions -s "$IPS" -n "$NODE_NUM"
    elif [ ! -z "$IP" ]; then
        echo von_generate_transactions -i "$IP" -n "$NODE_NUM"
        von_generate_transactions -i "$IP" -n "$NODE_NUM"
    else
        echo von_generate_transactions -n "$NODE_NUM"
        von_generate_transactions -n "$NODE_NUM"
    fi
fi

cat <<EOF > supervisord.conf
[supervisord]
logfile = /tmp/supervisord.log
logfile_maxbytes = 50MB
logfile_backups=${number}
loglevel = info
pidfile = /tmp/supervisord.pid
nodaemon = true
minfds = 1024
minprocs = 200
umask = 022
user = indy
identifier = supervisor
directory = /tmp
nocleanup = true
childlogdir = /tmp
strip_ansi = false

${[...Array(number)].map((_, index) => 
    `[program:node${index+1}]
command=start_indy_node Node${index+1} $HOST ${port++} $HOST ${port++}
directory=/home/indy
stdout_logfile=/tmp/node${index+1}.log
stderr_logfile=/tmp/node${index + 1}.log
`
    ).join('\n')
}
[program:printlogs]
command=tail -F /tmp/supervisord.log${[...Array(number)].map((_, index) =>` /tmp/node${index+1}.log`).join('')}
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

EOF

echo "Starting indy nodes"
supervisord
`;


fs.writeFile(number + '-dynamic_start_nodes.sh', startNodeFileContent, function (err) {
    if (err) return console.log(err);
    console.log('Hello World > helloworld.txt');
});

port = original_port;
let dockerComposeFileContent = `version: '3'
services:
    #
    # Client
    #
    client:
        image: von-network-base
        command: 'bash -c ''./scripts/start_client.sh'''
        environment:
            - IP=\${IP}
            - IPS=\${IPS}
            - DOCKERHOST=\${DOCKERHOST}
            - RUST_LOG=\${RUST_LOG}
        networks:
            - von
        volumes:
            - client-data:/home/indy/.indy_client
            - ./tmp:/tmp

    #
    # Webserver
    #
    webserver:
        image: von-network-base
        command: 'bash -c ''sleep 10; ./scripts/start_webserver.sh;'''
        environment:
            - IP=\${IP}
            - IPS=\${IPS}
            - DOCKERHOST=\${DOCKERHOST}
            - LOG_LEVEL=\${LOG_LEVEL}
            - RUST_LOG=\${RUST_LOG}
            - GENESIS_URL=\${GENESIS_URL}
            - ANONYMOUS=\${ANONYMOUS}
            - LEDGER_SEED=\${LEDGER_SEED}
            - LEDGER_CACHE_PATH=\${LEDGER_CACHE_PATH}
            - MAX_FETCH=\${MAX_FETCH:-50000}
            - RESYNC_TIME=\${RESYNC_TIME:-120}
            - REGISTER_NEW_DIDS=\${REGISTER_NEW_DIDS:-True}
            - LEDGER_INSTANCE_NAME=\${LEDGER_INSTANCE_NAME:-localhost} 
            - WEB_ANALYTICS_SCRIPT=\${WEB_ANALYTICS_SCRIPT}
            - INFO_SITE_TEXT=\${INFO_SITE_TEXT}
            - INFO_SITE_URL=\${INFO_SITE_URL}
        networks:
            - von
        ports:
            - \${WEB_SERVER_HOST_PORT:-9000}:8000
        volumes:
            - ./config:/home/indy/config
            - ./server:/home/indy/server
            - webserver-cli:/home/indy/.indy-cli
            - webserver-ledger:/home/indy/ledger

    #
    # Synchronization test
    #
    synctest:
        image: von-network-base
        command: 'bash -c ''./scripts/start_synctest.sh'''
        environment:
            - IP=\${IP}
            - IPS=\${IPS}
            - DOCKERHOST=\${DOCKERHOST}
            - LOG_LEVEL=\${LOG_LEVEL}
            - RUST_LOG=\${RUST_LOG}
        networks:
            - von
        ports:
            - \${WEB_SERVER_HOST_PORT:-9000}:8000
        volumes:
            - ./config:/home/indy/config
            - ./server:/home/indy/server
            - webserver-cli:/home/indy/.indy-cli
            - webserver-ledger:/home/indy/ledger

    #
    # Nodes
    #
    nodes:
        image: von-network-base
        command: 'bash -c ''./scripts/start_nodes.sh'''
        networks:
            - von
        ports:
${[...Array(number * 2)].map((_, index) => `            - ${port}:${port++}`).join('\n')}
        environment:
            - IP=\${IP}
            - IPS=\${IPS}
            - DOCKERHOST=\${DOCKERHOST}
            - LOG_LEVEL=\${LOG_LEVEL}
            - RUST_LOG=\${RUST_LOG}
        volumes:
            - nodes-data:/home/indy/ledger

${temp(original_port)}
networks:
    von:

volumes:
    client-data:
    webserver-cli:
    webserver-ledger:
${[...Array(number)].map((_, index) => `    node${index+1}-data:`).join('\n')}
    nodes-data:
`;

fs.writeFile(number + '-dynamic_docker-compose.yaml', dockerComposeFileContent, function (err) {
    if (err) return console.log(err);
    console.log('Hello World > helloworld.txt');
});

function temp (port) {
    return ([...Array(number)].map(
                (_, index) =>
                    `    node${index+1}:
        image: von-network-base
        command: 'bash -c ''./scripts/start_node.sh ${index + 1}'''
        networks:
            - von
        ports:
            - ${port}:${port++}
            - ${port}:${port++}
        environment:
            - IP=\${IP}
            - IPS=\${IPS}
            - DOCKERHOST=\${DOCKERHOST}
            - LOG_LEVEL=\${LOG_LEVEL}
            - RUST_LOG=\${RUST_LOG}
        volumes:
            - node${index + 1}-data:/home/indy/ledger\n`).join('\n'))
}