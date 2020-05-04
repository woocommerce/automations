import { ReportItems } from '../../definitions';
/**
 * See https://github.com/estheban/node-json2xml#options--behaviour
 */
export interface XMLReporterConfig {
    attributes_key?: string;
    header?: boolean;
}
export declare const reporter: ReportItems;
