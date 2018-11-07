import { Transpiler } from './transpiler';
import { ConfigurationInterface } from './configuration'
export function transpile(input: string, config: ConfigurationInterface) {
    return new Transpiler(input, config).transpiled;
}