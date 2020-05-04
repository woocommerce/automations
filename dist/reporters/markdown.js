"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const custom_1 = require("./custom");
const reporterConfig = {
    transformComment(file, line, text, _tag, ref) {
        if (ref) {
            text = `@${ref} ${text}`;
        }
        return [`| [${file}](${file}#L${line}) | ${line} | ${text}`];
    },
    transformHeader(tag) {
        return [`### ${tag}s`, `| Filename | line # | ${tag}`, '|:------|:------:|:------'];
    },
};
exports.reporter = (todos, config) => {
    const parsedConfig = custom_1.prepareConfig(reporterConfig, config);
    const output = custom_1.getTransformedComments(todos, parsedConfig);
    return custom_1.joinBlocksByHeaders(output, parsedConfig);
};
