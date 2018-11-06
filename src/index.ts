import { Transpiler } from './transpiler';
import { ConfigurationInterface } from './configuration'
export function Transpile(input: string, config: ConfigurationInterface) {
    return new Transpiler(input, config).transpiled;
}