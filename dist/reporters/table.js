"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logSymbols = __importStar(require("log-symbols"));
const chalk_1 = __importDefault(require("chalk"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const text_table_1 = __importDefault(require("text-table"));
const os_1 = require("os");
const eol_1 = require("eol");
function outputFooter(todos) {
    const total = todos.length;
    if (!total) {
        return os_1.EOL + ' ' + logSymbols.success + ' No todos/fixmes found';
    }
    let msg = total + ' todo' + (total === 1 ? '' : 's');
    msg += '/fixme' + (total === 1 ? '' : 's') + ' found';
    return os_1.EOL + ' ' + (total ? logSymbols.error : logSymbols.success) + ' ' + msg;
}
function outputTable(todos) {
    let contents = '';
    const headers = [];
    let previousFile;
    const mapTodo = (item, index) => {
        let text = chalk_1.default.cyan(item.text);
        if (item.ref) {
            text = chalk_1.default.gray('@' + item.ref) + ' ' + text;
        }
        const line = ['', chalk_1.default.gray('line ' + item.line), chalk_1.default.green(item.tag), text];
        if (item.file !== previousFile) {
            headers[index] = item.file;
        }
        previousFile = item.file;
        return line;
    };
    let t = text_table_1.default(todos.map(mapTodo), {
        stringLength(str) {
            return strip_ansi_1.default(str).length;
        },
    });
    //set filename headers
    t = eol_1.split(t)
        .map(function (el, i) {
        return headers[i] ? os_1.EOL + chalk_1.default.underline(headers[i]) + os_1.EOL + el : el;
    })
        .join(os_1.EOL);
    contents += t + os_1.EOL;
    return contents;
}
/**
 * Report the items using a formatted table (Useful for CLI)
 */
exports.reporter = (todos) => [outputTable(todos), outputFooter(todos)].join('');
