"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const os_1 = require("os");
/**
 * @hidden
 */
exports.getTransformedComments = (todos, config) => {
    const transformFn = config.transformComment;
    if (!todos.length) {
        //early return in case of no comments
        //FIXME: make the default header a configurable option
        return {
            TODO: [],
        };
    }
    return todos.reduce(function (mem, comment) {
        const tag = comment.tag;
        mem[tag] = mem[tag] || [];
        // transformed comment as an array item
        let transformedComment = transformFn(comment.file, comment.line, comment.text, tag, comment.ref);
        // enforce array type
        if (!Array.isArray(transformedComment)) {
            transformedComment = [transformedComment];
        }
        // append to tag array
        mem[tag] = mem[tag].concat(transformedComment);
        return mem;
    }, {});
};
/**
 * @hidden
 */
exports.joinBlocksByHeaders = (output, config) => {
    const padding = config.padding;
    const newLine = config.newLine;
    const transformHeader = config.transformHeader;
    let header;
    let contents = '';
    //prepend headers
    Object.keys(output).forEach(function (tag) {
        header = transformHeader(tag);
        // enforce array response
        if (!Array.isArray(header)) {
            header = [header];
        }
        output[tag] = lodash_1.default.compact(header.concat(output[tag]));
        // add padding between tag blocks
        if (contents.length) {
            contents += new Array(padding + 1).join(newLine);
        }
        contents += output[tag].join(newLine);
    });
    return contents;
};
/**
 * @hidden
 */
exports.prepareConfig = (defaultConfig, overrides) => {
    const config = lodash_1.default.defaults({}, overrides, defaultConfig, {
        newLine: os_1.EOL,
        padding: 2,
    });
    if (typeof config.transformHeader !== 'function') {
        throw new TypeError('transformHeader must be a function');
    }
    if (typeof config.transformComment !== 'function') {
        throw new TypeError('transformComment must be a function');
    }
    // padding must be a minimum of 0
    // enforce padding to be a number as well
    config.padding = Math.max(0, config.padding);
    return config;
};
const reporterConfig = {
    transformComment(file, line, text, _tag, ref) {
        return [`file: ${file}`, `line: ${line}`, `text: ${text}`, `ref:${ref}`];
    },
    transformHeader(tag) {
        return [`tag: ${tag}`];
    },
};
exports.reporter = (todos, config) => {
    const parsedConfig = exports.prepareConfig(reporterConfig, config);
    const output = exports.getTransformedComments(todos, parsedConfig);
    return exports.joinBlocksByHeaders(output, parsedConfig);
};
