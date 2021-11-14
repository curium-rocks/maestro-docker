import { IMaestro, LoggerFacade, ProviderSingleton } from "@curium.rocks/data-emitter-base";
import { JsonChronicler } from "@curium.rocks/json-chronicler";
import { SqlChronicler } from '@curium.rocks/sql-chronicler';
import { OwmEmitter } from "@curium.rocks/owm-emitter";
import { IMaestroConfig, Maestro } from "@curium.rocks/maestro";
import winston from "winston";

/**
 * Create a logger facade wrapper winston
 * @param {string} serviceName 
 * @return {LoggerFacade}
 */
function getLoggerFacade(serviceName: string): LoggerFacade {
    const logger = winston.createLogger({
        level: 'silly',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        defaultMeta: { service: serviceName },
        transports: [
          new winston.transports.Console()
        ],
      });
    return {
        info: logger.info.bind(logger),
        debug: logger.debug.bind(logger),
        trace: logger.silly.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
        critical: logger.error.bind(logger)
    }
}

/**
 * Get the configuraiton obj, in this case it's mostly static for demo purposes,
 * but this could fetch from a file, fill properties in from a DB etc.
 * @param {string} logDir log directory for json chronicler
 * @param {string} logName log name for json chronicler
 * @return {IMaestroConfig} 
 */
function getConfig(logDir?: string, logName?: string) : IMaestroConfig {
    return {
        id: 'meastro-id',
        name: 'meastro-name',
        description: 'meastro description',
        formatSettings: {
            encrypted: false,
            type: 'N/A'
        },
        connections: [],
        factories: {
            emitter: [{
                factoryType: OwmEmitter.TYPE,
                factoryPath: 'OwmEmitterFactory',
                packageName: '@curium.rocks/owm-emitter',
            }],
            chronicler: [{
                factoryType: JsonChronicler.TYPE,
                factoryPath: 'JsonChroniclerFactory',
                packageName: '@curium.rocks/json-chronicler'
            },{
                factoryType: SqlChronicler.TYPE,
                factoryPath: 'SqlChroniclerFactory',
                packageName: '@curium.rocks/sql-chronicler'
            }]
        },
        emitters: [],
        chroniclers: []
    }
}

const maestroOptions = {
    config: getConfig(),
    logger: getLoggerFacade('maestro'),
    loadHandler: () => {
        return Promise.resolve(getConfig());
    }
}
ProviderSingleton.getInstance().setLoggerFacade(maestroOptions.logger);
const maestro:IMaestro = new Maestro(maestroOptions);
maestro.start();

const logger = getLoggerFacade('maestro-heartbeat');
const heartbeatTimer = setInterval(() => {
    logger.debug('heartbeat');
}, 30000);

process.on('SIGINT', async () => {
    clearInterval(heartbeatTimer);
    await maestro.disposeAsync();
});

process.on('SIGTERM', async () => {
    clearInterval(heartbeatTimer);
    await maestro.disposeAsync();
});
