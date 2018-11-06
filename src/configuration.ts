export class Configuration {
    private layers: Array<any> = [];
    constructor(defaults?: any, layers?: Array<any>) {
        if (layers)
            this.layers = layers;
        this.layer(defaults);
    }
    public layer(config?: any): boolean {
        return !!(this.layers.unshift(config || {}))
    }
    public unlayer(): boolean {
        return !!(this.layers.shift())
    }
    public relayer(): boolean {
        return !!(this.layers[0] = {})
    }
    public clone(config?: any): Configuration {
        return new Configuration(config, this.layers)
    }
    public global(property: string, value?: string) {
        if (typeof value != 'undefined')
            this.layers[this.layers.length - 1][property] = value;
        else
            return this.layers[this.layers.length - 1][property];
    }
    public override(property: string, value?: string) {
        if (typeof value != 'undefined')
            this.layers.map((layer) => layer[property] = value)
        else
            this.layers.map((layer) => layer[property])
    }
    public value(property: string, value?: string) {
        if (typeof value != 'undefined')
            this.layers[0][property] = value;
        else
            for (var i = 0; i < this.layers.length; i++)
                if (this.layers[i].hasOwnProperty(property))
                    return this.layers[i][property];
    }
}

export interface ConfigurationInterface {
    quote?: string;
    stripcomments?: boolean;
    output?: string;
    trim?: boolean;
    newlines?: boolean;
    export?: boolean;
    debug?: boolean;
    format?: boolean;
    [propName: string]: any;
}