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
        connections: [{
            emitters: [
                'owm-emitter-1'
            ],
            chroniclers: [
                'json-chronicler-1',
                'sql-lite-chronicler-1'
            ]
        }],
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
        emitters: [{
            config: {
                type: OwmEmitter.TYPE,
                id: 'owm-emitter-1',
                name: 'OWM Emitter 1',
                description: "A OWM emitter",
                emitterProperties: {
                    checkInterval: 120000,
                    latitude: 29.421032,
                    longitude: -98.743582,
                    appId: '08feb18653feb09e2d6818cd0d8474f8'
                }
            }
        }],
        chroniclers: [{
            config: {
                type: JsonChronicler.TYPE,
                id: 'json-chronicler-1',
                name: 'Chronicler 1',
                description: "A json chronicler",
                chroniclerProperties: {
                    logDirectory: logDir || './logs',
                    logName: logName || 'maestro',
                    rotationSettings: {
                        days: 1
                    }
                }
            }
        },{
            config: {
                type: SqlChronicler.TYPE,
                id: 'sql-lite-chronicler-1',
                name: 'SQL Lite Chronicler',
                description: 'SQL Lite Chronicler',
                chroniclerProperties: {
                    type: 'sqlite',
                    database: 'max.sqllite',
                    connectionName: 'max-sql-lite'
                }
            }
        }]
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

process.on('SIGINT', async () => {
    await maestro.disposeAsync();
});
