import { ReportItems, ReporterConfig, TodoComment, TransformedComments } from '../../definitions';
/**
 * @hidden
 */
export declare const getTransformedComments: (todos: TodoComment[], config: ReporterConfig) => TransformedComments;
/**
 * @hidden
 */
export declare const joinBlocksByHeaders: (output: TransformedComments, config: ReporterConfig) => string;
/**
 * @hidden
 */
export declare const prepareConfig: (defaultConfig: ReporterConfig, overrides?: ReporterConfig) => ReporterConfig;
export declare const reporter: ReportItems;
