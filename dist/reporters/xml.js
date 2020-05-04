"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json2xml_1 = __importDefault(require("json2xml"));
exports.reporter = (todos, config = { header: true }) => {
    return json2xml_1.default(todos, {
        header: config.header,
        attributes_key: config.attributes_key,
    });
};
